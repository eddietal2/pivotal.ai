🚀 Pivotal.ai: Agentic AI Swing Trading Advisor

Pivotal.ai is a full-stack, data-driven application that utilizes a custom-built Agentic AI system to identify high-probability swing trading opportunities in the stock and options markets.

This project is designed to showcase mastery in building secure, highly scalable, and disciplined full-stack applications, adhering to best practices like Test-Driven Development (TDD) and Clean Architecture.

💡 Core Value Proposition

In the chaotic world of trading data, Pivotal.ai acts as an intelligent scout. It replaces manual analysis by processing multiple market indicators (Price Action, RSI, Moving Averages) and translating complex data into a concise, actionable trading recommendation (BUY/SHORT) complete with a target price and risk assessment.

🛠️ Technical Architecture

This application leverages a modern, decoupled stack for security, speed, and maintainability.

Component

Technology

Rationale

Backend / API

Django (Python), Django REST Framework

Chosen for robust transactional integrity, built-in security features, and the mature ORM integration with PostgreSQL—critical for a financial application.

Agentic AI Logic

Gemini API (Python), Custom Tools

The core intelligence. The agent is prompted with market data and defined trading rules, operating independently to generate actionable insights.

Data Source

Alpha Vantage API (or similar)

Provides reliable, granular historical and real-time data necessary for calculating technical indicators (e.g., 50-day SMA, RSI).

Frontend / UI

Next.js (React)

Provides a fast, modern, and SEO-friendly user interface, capable of displaying interactive charts and real-time trade alerts.

Database

PostgreSQL

Utilized for its superior transactional reliability and advanced indexing capabilities required for storing financial data securely.

🧠 Key Engineering Highlights

TDD Workflow: All critical business logic, especially in the Django services (calculating indicators, running agent prompts), was built using a Test-Driven Development approach to ensure near 100% Branch Coverage for financial calculations.

Atomic Transactions: All simulated debits/credits and balance updates utilize django.db.transaction.atomic() to guarantee ACID compliance and prevent data corruption.

Agentic Tool Use: The Python agent logic demonstrates the ability to invoke external tools (the Alpha Vantage data fetcher) and synthesize that information based on a rigorous system instruction prompt.

Decoupled Services: The Agent logic, the data fetching, and the API request handling are separated into distinct service layers, maximizing code clarity and testability.