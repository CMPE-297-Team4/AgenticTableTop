# Dependencies Documentation

## Overview

This project uses a minimal set of dependencies to keep installation fast and maintainable. Heavy ML packages are separated into optional dependencies.

## Core Dependencies (`requirements.txt`)

These are **actively used** in the codebase and required for the project to run:

### Essential
- **pydantic** (2.11.1) - Data validation and settings management
  - Used in: `src/core/state.py` for GameStatus model
- **PyYAML** - YAML configuration file parsing
  - Used in: `src/core/agents.py` for loading `config.yaml`

### LLM Providers
- **langchain-openai** - OpenAI GPT integration
  - Used in: `src/core/model.py` for ChatOpenAI
- **langchain-google-genai** - Google Gemini integration
  - Used in: `src/core/model.py` for ChatGoogleGenerativeAI

### Framework
- **langgraph** (0.6.8) - Agent orchestration framework
  - Currently configured but not actively used
  - Intended for future multi-agent workflows

### Utilities
- **numpy** - Numerical computing (commonly needed)
- **requests** (2.32.1) - HTTP library (commonly needed)

## Optional Dependencies (`requirements-optional.txt`)

These are **NOT currently used** but available for future features:

### Heavy ML Packages
- **transformers** - Hugging Face transformers library
  - For: Local LLM models, embeddings
  - Size: ~500MB
- **torch** - PyTorch deep learning framework
  - For: Running local models
  - Size: ~2GB
- **tensorflow** - TensorFlow deep learning framework
  - For: Alternative to PyTorch
  - Size: ~500MB

### Data Analysis & Visualization
- **pandas** - Data manipulation and analysis
  - For: Campaign analytics, data exports
- **matplotlib** (3.8.1) - Plotting library
  - For: Campaign visualizations, statistics
- **seaborn** (0.13.2) - Statistical data visualization
  - For: Enhanced plotting

## Development Dependencies (`requirements-dev.txt`)

Testing and code quality tools:

- **pytest** (7.4.3) - Testing framework
- **pytest-cov** (4.1.0) - Coverage reporting
- **pytest-mock** (3.12.0) - Mocking utilities
- **black** (23.12.1) - Code formatting
- **isort** (5.13.2) - Import sorting
- **flake8** (7.0.0) - Linting
- **mypy** (1.8.0) - Type checking
- **pre-commit** (3.6.0) - Git hooks

## Installation Guide

### Minimal Installation (Fastest)
For basic campaign generation:
```bash
pip install -r requirements.txt
```

### Full Installation
If you need ML features:
```bash
pip install -r requirements.txt
pip install -r requirements-optional.txt
```

### Development Setup
For contributing to the project:
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
pre-commit install
```

## Dependency Cleanup (October 12, 2025)

### Problem
The original `requirements.txt` included heavy ML packages (`transformers`, `torch`, `tensorflow`) that:
1. Were not used in the codebase
2. Required system libraries (`pkg-config`)
3. Caused installation failures
4. Added ~3GB of dependencies
5. Slowed down installation significantly

### Solution
Separated dependencies into:
- **requirements.txt**: Only actively used packages (~100MB)
- **requirements-optional.txt**: Heavy ML packages for future use (~3GB)

### Benefits
- Faster installation (seconds vs minutes)
- No system library dependencies required
- Smaller Docker images
- Clearer dependency purpose
- Easier onboarding for contributors
- Maintains simplicity per project goals

## Adding New Dependencies

### When to Add to Core Requirements
Add to `requirements.txt` if:
- The package is imported in the codebase
- The feature using it is core functionality
- It's a lightweight package (<50MB)

### When to Add to Optional Requirements
Add to `requirements-optional.txt` if:
- The package is for future/experimental features
- It's a heavy package (>50MB)
- It's only needed for specific use cases
- It requires system libraries

### Process
1. Add the package to appropriate requirements file
2. Specify exact version when possible
3. Add a comment explaining its purpose
4. Update this documentation
5. Test installation on clean environment

## Checking for Unused Dependencies

Run this command to see what's imported:
```bash
grep -r "^import \|^from " . --include="*.py" | grep -v "__pycache__" | sort -u
```

Compare with installed packages:
```bash
pip list --format=freeze
```

Remove any packages that aren't imported anywhere.

## Troubleshooting

### Issue: `pkg-config: command not found`
**Cause**: Trying to install old requirements.txt with sentencepiece
**Fix**: Use the new cleaned requirements.txt

### Issue: `ModuleNotFoundError: No module named 'transformers'`
**Cause**: Code trying to use optional dependencies
**Fix**: Install optional requirements: `pip install -r requirements-optional.txt`

### Issue: Tests failing due to missing langchain packages
**Cause**: Core dependencies not installed
**Fix**: Install core requirements: `pip install -r requirements.txt`

## Version Pinning Strategy

- **Exact versions** for critical packages (pydantic, langgraph)
- **No version** for stable packages unlikely to break (PyYAML, numpy)
- **Major version constraints** for future packages (e.g., `package>=1.0,<2.0`)

This strategy balances stability with getting security updates.

