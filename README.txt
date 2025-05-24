Executar o backend localmente

- criar o embiente virtual (python -m venv venv)

- iniciar o ambiente virtual (venv\Scripts\activate)

- instalar dependencias do requirements.txt (pip install -r requirements.txt)

- cirar um arquivo .env e configurá-lo da seguinte forma:
    HUGGINGFACE_API_KEY= #colocar sua chave do huggingface aqui
    API_HOST=0.0.0.0
    API_PORT=8000

- executar o arquivo main.py (python main.py)