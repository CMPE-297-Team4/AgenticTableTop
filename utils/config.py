# LLM Configuration
# These settings control the connection and behavior of the Large Language Model API
# Please fill in your own API information below

OPENAI_API_BASE = "https://api.openai.com/v1" #"http://10.147.20.224:4243/v1"
OPENAI_API_MODEL = "gpt-4o-mini"
LLM_REQUEST_TIMEOUT = 60
TEMPERATURE = 0.0  # The temperature of the model: the lower the value, the more consistent the output of the model
MAX_TOKENS = 500  # The max token limit for the response completion