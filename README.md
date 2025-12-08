# 🚀 Pivotal.ai: Agentic AI Swing Trading Advisor

Pivotal.ai is a **full-stack, data-driven application** that utilizes a custom-built **Agentic AI system** to identify high-probability swing trading opportunities in the stock and options markets.

This project is designed to showcase mastery in building secure, highly scalable, and disciplined full-stack applications, adhering to best practices like **Test-Driven Development (TDD)** and **Clean Architecture**.

Demo Link: https://pivotal-ai-web-app.vercel.app/

** [Currently Under Construction - Link & Video Last Updated @ 12/08/2025 ~ Working on Front End Development] **

![Demo GIF](https://github.com/eddietal2/pivotal.ai/design/demo_gifs/2_08_2025_demo.gif)
![](https://github.com/eddietal2/pivotal.ai/blob/main/design/demo_gifs/2_08_2025_demo.gif)
---

## 💡 Core Value Proposition

In the chaotic world of trading data, Pivotal.ai acts as an **intelligent scout**. It replaces manual analysis by processing multiple market indicators and translating complex data into a **concise, actionable trading recommendation** (BUY/SHORT) complete with a target price and risk assessment.

* **Indicators Processed:** Price Action, Relative Strength Index (RSI), Moving Averages (e.g., 50-day SMA).
* **Output:** Actionable trade recommendation, Target Price, Stop-Loss/Risk Assessment.



---

## 🛠️ Technical Architecture

This application leverages a modern, decoupled stack for security, speed, and maintainability.

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend / API** | Django (Python), Django REST Framework | Chosen for **robust transactional integrity**, built-in security features, and the mature ORM integration with PostgreSQL—critical for a financial application. |
| **Agentic AI Logic** | Gemini API (Python), Custom Tools | The **core intelligence**. The agent is prompted with market data and defined trading rules, operating independently to generate actionable insights. |
| **Data Source** | Alpha Vantage API (or similar) | Provides **reliable, granular historical and real-time data** necessary for calculating technical indicators. |
| **Frontend / UI** | Next.js (React) | Provides a fast, modern, and SEO-friendly user interface, capable of displaying **interactive charts and real-time trade alerts**. |
| **Database** | PostgreSQL | Utilized for its superior **transactional reliability** and advanced indexing capabilities required for storing financial data securely. |

---

## 🧠 Key Engineering Highlights

This project emphasizes financial rigor and software discipline through several key architectural choices:

* ### ✅ **TDD Workflow & Coverage**
    All critical business logic, especially in the Django services (calculating indicators, running agent prompts), was built using a **Test-Driven Development (TDD)** approach to ensure near **100% Branch Coverage** for all financial calculations.

* ### 🔒 **Atomic Transactions (ACID Compliance)**
    All simulated debits/credits and balance updates utilize `django.db.transaction.atomic()` to **guarantee ACID compliance** (Atomicity, Consistency, Isolation, Durability) and prevent data corruption in the trading log.

* ### ⚙️ **Agentic Tool Use Demonstration**
    The Python agent logic demonstrates the ability to invoke **external tools** (the Alpha Vantage data fetcher) and synthesize that information based on a rigorous, **system instruction prompt**, showcasing sophisticated LLM utilization.

* ### 🧱 **Decoupled Services**
    The Agent logic, the data fetching, and the API request handling are separated into distinct **service layers**, maximizing code clarity, maintainability, and testability.
