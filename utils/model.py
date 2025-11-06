import os

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

# LLM Configuration
# These settings control the connection and behavior of the Large Language Model API
# Please fill in your own API information below
MODEL_TYPE = "GEMINI"  # OPENAI or GEMINI
API_BASE = (
    "https://gemini.google.com/v1"  # "https://api.openai.com/v1" or "https://gemini.google.com/v1" etc
)
MODEL = "gemini-2.5-flash"  # "gpt-4o-mini" or "gemini-2.5-flash" etc
LLM_REQUEST_TIMEOUT = 60
TEMPERATURE = 0.7  # The temperature of the model: the lower the value, the more consistent the output of the model
OPENAI_MAX_TOKENS = 3000  # The max token limit for the response completion
GEMINI_MAX_TOKENS = 5000  # The max token limit for the response completion

# LLM Model Initialization
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def initialize_llm():
    if not OPENAI_API_KEY and not GEMINI_API_KEY:
        raise ValueError("Please set up your API keys in environment variables")

    if MODEL_TYPE == "OPENAI":
        model = ChatOpenAI(
            openai_api_base=API_BASE,
            openai_api_key=OPENAI_API_KEY,
            model_name=MODEL,
            request_timeout=LLM_REQUEST_TIMEOUT,
            max_tokens=OPENAI_MAX_TOKENS,
            temperature=TEMPERATURE,
        )
    elif MODEL_TYPE == "GEMINI":
        model = ChatGoogleGenerativeAI(
            google_api_key=GEMINI_API_KEY,
            model=MODEL,
            request_timeout=LLM_REQUEST_TIMEOUT,
            max_tokens=GEMINI_MAX_TOKENS,
            temperature=TEMPERATURE,
        )
    return model
