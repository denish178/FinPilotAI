import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "FinPilot AI API",
      version: "1.0.0",
      description:
        "Production-ready Personal Finance Management API with JWT auth, transactions, budgets, goals, analytics, and AI insights.",
      contact: {
        name: "FinPilot AI",
      },
    },
    servers: [
      { url: "http://localhost:5000", description: "Local development" },
      { url: "http://localhost:8080", description: "Docker (via nginx proxy)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            statusCode: { type: "integer" },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        TransactionInput: {
          type: "object",
          required: ["type", "amount", "category"],
          properties: {
            type: { type: "string", enum: ["income", "expense"] },
            amount: { type: "number", example: 250 },
            category: { type: "string", example: "Food" },
            description: { type: "string", example: "Lunch" },
            date: { type: "string", format: "date-time" },
            paymentMethod: { type: "string", example: "upi" },
          },
        },
        BudgetInput: {
          type: "object",
          required: ["category", "monthlyLimit"],
          properties: {
            category: { type: "string", example: "Food" },
            monthlyLimit: { type: "number", example: 5000 },
            month: { type: "integer", example: 7 },
            year: { type: "integer", example: 2026 },
          },
        },
        GoalInput: {
          type: "object",
          required: ["goalName", "targetAmount"],
          properties: {
            goalName: { type: "string", example: "Emergency Fund" },
            targetAmount: { type: "number", example: 100000 },
            deadline: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & profile" },
      { name: "Transactions", description: "Income & expense management" },
      { name: "Dashboard", description: "Analytics & summaries" },
      { name: "Budgets", description: "Monthly budget limits" },
      { name: "Goals", description: "Savings goals" },
      { name: "Notifications", description: "User notifications" },
      { name: "AI", description: "Financial AI insights" },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["Auth"],
          summary: "Health check",
          responses: { 200: { description: "API is running" } },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "User registered" } },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Login successful" } },
        },
      },
      "/api/auth/refresh-token": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          responses: { 200: { description: "New access token issued" } },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Current user profile" } },
        },
      },
      "/api/auth/settings": {
        get: {
          tags: ["Auth"],
          summary: "Get user settings",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Settings fetched" } },
        },
        patch: {
          tags: ["Auth"],
          summary: "Update user settings",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Settings updated" } },
        },
      },
      "/api/transactions": {
        get: {
          tags: ["Transactions"],
          summary: "List transactions",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: { 200: { description: "Paginated transactions" } },
        },
        post: {
          tags: ["Transactions"],
          summary: "Create transaction",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TransactionInput" },
              },
            },
          },
          responses: { 201: { description: "Transaction created" } },
        },
      },
      "/api/transactions/import": {
        post: {
          tags: ["Transactions"],
          summary: "Bulk import transactions (CSV parsed JSON)",
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: "Transactions imported" } },
        },
      },
      "/api/transactions/{id}": {
        get: {
          tags: ["Transactions"],
          summary: "Get transaction by ID",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Transaction details" } },
        },
        put: {
          tags: ["Transactions"],
          summary: "Update transaction",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Transaction updated" } },
        },
        delete: {
          tags: ["Transactions"],
          summary: "Soft delete transaction",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Transaction deleted" } },
        },
      },
      "/api/dashboard/overview": {
        get: {
          tags: ["Dashboard"],
          summary: "Dashboard overview (all charts data)",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Dashboard data" } },
        },
      },
      "/api/budgets": {
        get: {
          tags: ["Budgets"],
          summary: "List budgets",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Budget list" } },
        },
        post: {
          tags: ["Budgets"],
          summary: "Create budget",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BudgetInput" },
              },
            },
          },
          responses: { 201: { description: "Budget created" } },
        },
      },
      "/api/goals": {
        get: {
          tags: ["Goals"],
          summary: "List savings goals",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Goals list" } },
        },
        post: {
          tags: ["Goals"],
          summary: "Create savings goal",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoalInput" },
              },
            },
          },
          responses: { 201: { description: "Goal created" } },
        },
      },
      "/api/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "List notifications",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Notifications list" } },
        },
      },
      "/api/ai/insights": {
        get: {
          tags: ["AI"],
          summary: "Get AI financial insights",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "AI insights bundle" } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
