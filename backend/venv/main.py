
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging
from typing import Optional, Dict, Any
import re
from datetime import datetime
import json
from huggingface_hub import AsyncInferenceClient

# Carregar variáveis de ambiente
load_dotenv()

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Email AI Classifier", version="1.0.0")

# Configurar CORS para React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173", 'https://ai-email-response.vercel.app/'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmailRequest(BaseModel):
    content: str
    subject: Optional[str] = ""
    sender: Optional[str] = ""

class EmailResponse(BaseModel):
    category: str
    confidence: float
    suggested_response: str
    analysis: Dict[str, Any]
    processing_time: float

class AIService:
    def __init__(self):
        self.huggingface_api_key = os.getenv('HUGGINGFACE_API_KEY')
        
        # Configurar huggingface se disponível
        if self.huggingface_api_key:
            self.client = AsyncInferenceClient(
            provider="cohere",
            api_key=self.huggingface_api_key)

            logger.info("HUGGINGFACE API KEY OK")
        
    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        
        # Remove URLs e emails
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove caracteres especiais excessivos
        text = re.sub(r'[^\w\s\-.,!?áàâãéèêíïóôõöúçñ]', '', text)
        
        # Normaliza espaços
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def tokenize_text(self, text: str) -> str:
        if not text:
            return ""
        
        tokens = text.split()
        
        return ' '.join(tokens)
    
    def remove_stopwords(self, text: str) -> str:
        if not text:
            return ""
        
        stopwords = set([
            "a", "o", "e", "de", "da", "do", "que", "com", "para", "em", "um", "uma",
            "na", "no", "dos", "das", "as", "os", "se", "por", "mais", "mas"
        ])
        
        tokens = text.split()
        filtered_tokens = [word for word in tokens if word.lower() not in stopwords]
        
        return ' '.join(filtered_tokens)
    
    async def classify_with_huggingface(self, email_content: str) -> Dict[str, Any]:
        #prompt gerado por IA
        try:
            prompt = f"""
            Analise o seguinte email e classifique-o como "produtivo" ou "improdutivo":

            Email: "{email_content}"

            Critérios:
            - PRODUTIVO: Relacionado a trabalho, negócios, projetos, reuniões, contratos, propostas, relatórios, decisões importantes
            - IMPRODUTIVO: Spam, correntes, piadas, fofocas, assuntos pessoais irrelevantes, propaganda não solicitada

            Responda APENAS em formato JSON, sem nada antes ou depois das chaves:
            {{
                "category": "produtivo" ou "improdutivo",
                "confidence": 0.0 a 1.0,
                "reasoning": "breve explicação da classificação",
                "keywords": ["palavras-chave", "identificadas"]
            }}
            """
            response = await self.client.chat.completions.create(
                model="CohereLabs/aya-expanse-8b",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
            )
            
            result_text = response.choices[0].message.content.strip()
            
            try:
                result = json.loads(result_text)
                return result
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=500, detail=f"Erro na classificação: {str(result_text)}")
                
        except Exception as e:
            logger.error(f"Erro na classificação huggingface: {e}")
            raise HTTPException(status_code=500, detail=f"Erro na classificação: {str(e)}")

    async def generate_response_huggingface(self, email_content: str, category: str) -> str:
        # prompt gerado por IA
        try:
            if category == "produtivo":
                prompt = f"""
                Gere uma resposta profissional e cordial para este email produtivo:
                "{email_content}"
                
                A resposta deve:
                - Ser profissional e educada
                - Confirmar o recebimento
                - Indicar que será analisado/processado
                - Ter no máximo 2-3 frases
                - Estar em português
                """
            else:
                prompt = f"""
                Gere uma resposta educada mas breve para este email improdutivo:
                "{email_content}"
                
                A resposta deve:
                - Ser educada mas direta
                - Indicar foco em questões profissionais
                - Ter no máximo 1-2 frases
                - Estar em português
                """
            
            response = await self.client.chat.completions.create(
                model="CohereLabs/aya-expanse-8b",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Erro na geração de resposta huggingface: {e}")

ai_service = AIService()

@app.post("/classify", response_model=EmailResponse)
async def classify_email(request: EmailRequest):
    start_time = datetime.now()
    
    try:
        if not request.content.strip():
            raise HTTPException(status_code=400, detail="Conteúdo do email não pode estar vazio")
        
        full_content = f"{request.subject} {request.content}".strip()
        cleaned_content = ai_service.clean_text(full_content)
        
        classification = await ai_service.classify_with_huggingface(cleaned_content)
        suggested_response = await ai_service.generate_response_huggingface(cleaned_content, classification["category"])
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return EmailResponse(
            category=classification["category"],
            confidence=classification["confidence"],
            suggested_response=suggested_response,
            analysis={
                "reasoning": classification.get("reasoning", ""),
                "keywords": classification.get("keywords", []),
                "content_length": len(request.content),
                "has_subject": bool(request.subject),
                "sender": request.sender or "unknown"
            },
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado na classificação: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )