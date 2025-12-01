---
inclusion: manual
---

# API Development Guidelines

## Adding New Endpoints

### Backend Steps
1. Define Pydantic schema in `backend/schemas.py`
2. Add database model in `backend/models.py` if needed
3. Create migration with Alembic if database changes needed
4. Implement endpoint in `backend/main.py`
5. Add authentication with `Depends(auth.get_current_user)` if needed
6. Test in Swagger UI at `/docs`

### Frontend Integration
1. Create API call function with proper error handling
2. Add loading and error states
3. Include Authorization header for protected endpoints
4. Update UI to display data

## Example: Adding a New Protected Endpoint

```python
# backend/schemas.py
class ItemCreate(BaseModel):
    name: str
    description: str | None = None

class ItemResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

# backend/main.py
@app.post("/api/items", response_model=schemas.ItemResponse)
async def create_item(
    item: schemas.ItemCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_item = models.Item(**item.dict(), user_id=current_user.id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item
```

## Frontend API Call Pattern

```javascript
const createItem = async (itemData) => {
  try {
    const response = await fetch(`${API_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(itemData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error: error.detail };
    }
  } catch (err) {
    return { success: false, error: 'Connection error' };
  }
};
```
