Version 1

✓ User Authentication
✓ Dashboard
✓ Add Expense
✓ Add Income
✓ Expense Categories
✓ Charts
✓ Monthly Budget
✓ User Profile

---------------------

Version 2

✓ AI Financial Advisor
✓ Receipt Scanner
✓ OCR
✓ Voice Expense Entry
✓ Subscription Tracker
✓ Notifications


For Version 1:

User :- 
{
  _id,
  name,
  email,
  password,
  avatar
}

Transaction :-
{
  _id,
  userId,
  type,
  amount,
  category,
  note,
  paymentMethod,
  date
}

Budget :-
{
  _id,
  userId,
  month,
  category,
  limit
}

| Folder      | Responsibility                             |
| ----------- | ------------------------------------------ |
| config      | Database, environment configuration        |
| controllers | Business logic                             |
| routes      | API endpoints                              |
| models      | MongoDB schemas                            |
| middleware  | Authentication, validation, error handling |
| services    | Reusable business services                 |
| validators  | Request validation                         |
| utils       | Helper functions                           |
