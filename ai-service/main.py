import math
import os

import httpx
import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from langchain_ollama import OllamaEmbeddings
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="IntellectaReview AI Service")

embeddings = OllamaEmbeddings(
    model=os.getenv("EMBEDDING_MODEL", "nomic-embed-text"),
    base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
)

summary_model = os.getenv("SUMMARY_MODEL", "mistral")
ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
ollama_keywords_timeout = float(os.getenv("OLLAMA_KEYWORDS_TIMEOUT", "180"))
ollama_summary_timeout = float(os.getenv("OLLAMA_SUMMARY_TIMEOUT", "180"))
OLLAMA_CHAT_TIMEOUT=300

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


def cosine_similarity(a, b):
    size = min(len(a), len(b))
    if size == 0:
        return 0.0

    dot_product = sum(a[index] * b[index] for index in range(size))
    a_norm = math.sqrt(sum(value * value for value in a[:size]))
    b_norm = math.sqrt(sum(value * value for value in b[:size]))
    if a_norm == 0 or b_norm == 0:
        return 0.0
    return float(dot_product / (a_norm * b_norm))


def to_pgvector_literal(values):
    if not values:
        return "[]"
    return "[" + ",".join(str(float(value)) for value in values) + "]"


class EmbedRequest(BaseModel):
    paperId: int
    title: str
    abstrakt: str = ""
    keywords: list[str] = Field(default_factory=list)


class SearchRequest(BaseModel):
    query: str | None = None
    topK: int = 5
    query_embedding: list[float] | None = None
    top_k: int | None = None
    exclude_paper_id: int | None = None


class SummarizeRequest(BaseModel):
    paper_id: int = Field(alias="paper_id")
    title: str
    abstract: str = ""
    content: str | None = ""


class SummaryResponse(BaseModel):
    summary: str


class CategoryResponse(BaseModel):
    category: str


class ChatRequest(BaseModel):
    query: str
    top_k: int | None = 5
    paper_id: int | None = None
    title: str = ""
    abstract: str = ""
    keywords: list[str] = Field(default_factory=list)
    category: str = ""


class ChatSource(BaseModel):
    paperId: int | None = None
    title: str | None = None
    snippet: str | None = None
    score: float | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource] = Field(default_factory=list)


@app.get("/health")
def health():
    return {"status": "ok", "model": os.getenv("EMBEDDING_MODEL")}


@app.post("/embed")
def embed_paper(request: EmbedRequest):
    try:
        text = f"{request.title}. {request.abstrakt}. {' '.join(request.keywords)}"
        vector = embeddings.embed_query(text)

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE papers SET embedding = %s WHERE id = %s",
            (vector, request.paperId)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            "success": True,
            "paperId": request.paperId,
            "vectorDimensions": len(vector)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
def search_similar(request: SearchRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Plagiarism mode: direct cosine similarity search against stored vectors.
        if request.query_embedding is not None:
            top_k = request.top_k if request.top_k is not None else request.topK
            cur.execute("SELECT id, title, abstrakt, embedding FROM papers WHERE embedding IS NOT NULL")
            rows = cur.fetchall()
            cur.close()
            conn.close()

            results = []
            for row in rows:
                if request.exclude_paper_id is not None and row[0] == request.exclude_paper_id:
                    continue

                emb = row[3]
                if isinstance(emb, str):
                    import json as _json
                    try:
                        emb = _json.loads(emb)
                    except (ValueError, TypeError):
                        continue

                if not isinstance(emb, (list, tuple)) or len(emb) == 0:
                    continue

                similarity = cosine_similarity(request.query_embedding, emb)
                results.append({
                    "paper_id": row[0],
                    "title": row[1],
                    "abstract": row[2],
                    "similarity_score": round(similarity, 4),
                })

            results.sort(key=lambda item: item["similarity_score"], reverse=True)
            return results[:top_k]

        # Semantic mode: text query embedding then cosine similarity in Python.
        if not request.query:
            raise HTTPException(status_code=400, detail="query is required when query_embedding is not provided")

        query_vector = embeddings.embed_query(request.query)
        cur.execute("SELECT id, title, abstrakt, embedding FROM papers WHERE embedding IS NOT NULL")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        results = []
        for row in rows:
            emb = row[3]
            if isinstance(emb, str):
                import json as _json
                try:
                    emb = _json.loads(emb)
                except (ValueError, TypeError):
                    continue
            if not isinstance(emb, (list, tuple)) or len(emb) == 0:
                continue
            similarity = cosine_similarity(query_vector, emb)
            results.append({
                "paperId": row[0],
                "title": row[1],
                "abstract": row[2],
                "similarity": round(similarity, 4)
            })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return {"results": results[:request.topK]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize")
def summarize_paper(request: SummarizeRequest):
    content = (request.content or "")[:3000]
    prompt = (
        "You are a scientific paper reviewer. Given this paper, write a concise critical review summary "
        "(3-5 sentences) covering: main contribution, methodology strength, potential weaknesses, and overall recommendation.\n\n"
        f"Paper ID: {request.paper_id}\n"
        f"Title: {request.title}\n"
        f"Abstract: {request.abstract}\n"
        f"Content: {content}\n\n"
        "Write only the summary text, no bullet points, no headings."
    )

    try:
        response = httpx.post(
            f"{ollama_base_url}/api/generate",
            json={
                "model": summary_model,
                "prompt": prompt,
                "stream": False
            },
            timeout=ollama_summary_timeout,
        )
        response.raise_for_status()
        payload = response.json()
        summary = (payload.get("response") or "").strip()
        if not summary:
            raise HTTPException(status_code=500, detail="Ollama returned an empty summary")
        return SummaryResponse(summary=summary)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to call Ollama: {exc}")


class KeywordsRequest(BaseModel):
    text: str
    top_k: int | None = 6


class CategoryRequest(BaseModel):
    text: str


@app.post("/category")
def suggest_category(request: CategoryRequest):
    prompt = (
        "Classify the following scientific paper into one concise research category label. "
        "Return only the category name, no extra text. Prefer broad academic categories such as: "
        "Machine Learning, NLP, Computer Vision, Information Retrieval, Data Mining, Software Engineering, "
        "Networks, Security, Databases, HCI, Robotics, Systems, Theory.\n\n"
        f"Text:\n{request.text}"
    )

    try:
        response = httpx.post(
            f"{ollama_base_url}/api/generate",
            json={
                "model": summary_model,
                "prompt": prompt,
                "stream": False,
            },
            timeout=30.0,
        )
        response.raise_for_status()
        payload = response.json()
        category = (payload.get("response") or "").strip()
        if not category:
            raise HTTPException(status_code=500, detail="Ollama returned an empty category")
        return CategoryResponse(category=category)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to call Ollama: {exc}")


@app.post("/keywords")
def extract_keywords(request: KeywordsRequest):
    prompt = (
        "Extract the top {k} technical keywords or keyphrases from the following scientific text. "
        "Return the keywords as a JSON array of strings only, no commentary. If uncertain, prefer precise technical phrases.\n\n"
    ).replace("{k}", str(request.top_k or 6)) + "Text:\n" + request.text

    try:
        response = httpx.post(
            f"{ollama_base_url}/api/generate",
            json={
                "model": summary_model,
                "prompt": prompt,
                "stream": False,
            },
            timeout=ollama_keywords_timeout,
        )
        response.raise_for_status()
        payload = response.json()
        raw = (payload.get("response") or "").strip()
        # try to parse JSON array, otherwise fallback to comma split
        import json as _json
        try:
            parsed = _json.loads(raw)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            # fallback split
            parts = [p.strip() for p in raw.replace('\n', ',').split(',') if p.strip()]
            return parts[: (request.top_k or 6)]

    except httpx.HTTPError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to call Ollama: {exc}")

    raise HTTPException(status_code=500, detail="Empty keywords response from Ollama")


@app.post("/chat")
def chat_about_paper(request: ChatRequest):
    query = (request.query or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    # Context: use ONLY the current paper being reviewed, not other papers.
    current_paper = (
        f"Title: {request.title}\n"
        f"Abstract: {request.abstract}\n"
        f"Keywords: {', '.join(request.keywords)}\n"
        f"Category: {request.category or 'Unspecified'}"
    )

    prompt = (
        "You are an academic reviewer assistant. Your ONLY job is to answer questions about the specific paper provided below. "
        "DO NOT mention or cite any other papers. DO NOT reference research outside this paper. "
        "DO NOT include a 'Sources' section or reference list. Only use information from the paper below.\n\n"
        f"PAPER TO ANALYZE:\n{current_paper}\n\n"
        f"REVIEWER'S QUESTION: {query}\n\n"
        "REQUIREMENTS:\n"
        "1. Answer ONLY based on the paper above\n"
        "2. Do NOT mention other papers, books, or external sources\n"
        "3. Do NOT include 'Sources:' or 'References:' sections\n"
        "4. Be direct and focus on what is in this paper only\n"
        "5. Use bullet points or structured paragraphs for clarity\n"
        "6. If information is not in the paper, say 'This paper does not cover this topic'\n\n"
        "ANSWER:"
    )

    try:
        response = httpx.post(
            f"{ollama_base_url}/api/generate",
            json={
                "model": summary_model,
                "prompt": prompt,
                "stream": False,
            },
            timeout=float(os.getenv("OLLAMA_CHAT_TIMEOUT", "300")),
        )
        response.raise_for_status()
        payload = response.json()
        answer = (payload.get("response") or "").strip()
        if not answer:
            raise HTTPException(status_code=500, detail="Ollama returned an empty answer")

        # Clean up the response: remove any "Sources:" or "References:" sections that Ollama might add
        # despite the explicit instructions above
        answer = remove_sources_section(answer)

        return ChatResponse(
            answer=answer,
            sources=[]  # No external sources; only current paper used.
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to call Ollama: {exc}")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def remove_sources_section(text: str) -> str:
    """Remove any 'Sources:', 'References:', or 'Related Papers:' sections that Ollama might add."""
    lines = text.split('\n')
    result = []
    skip_mode = False
    
    for line in lines:
        line_lower = line.lower().strip()
        # Start skipping if we hit a sources/references section
        if any(section in line_lower for section in ['sources:', 'references:', 'related papers:', 'bibliography:']):
            skip_mode = True
            continue
        # Stop skipping if we hit a new section that starts with an uppercase word followed by colon
        # But be careful not to skip legitimate content
        if skip_mode and line.strip() and line[0].isupper() and ':' in line and line_lower not in ['sources:', 'references:', 'related papers:', 'bibliography:']:
            # This might be a new section, exit skip mode
            skip_mode = False
        
        if not skip_mode:
            result.append(line)
    
    answer = '\n'.join(result).strip()
    return answer if answer else text
