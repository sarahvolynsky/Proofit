# ChatKit API Note

## Important: API Mismatch

The actual `chatkit` package (installed from GitHub) has a **different API** than what was coded in `chatkit_server.py`.

### Actual Package Structure

The installed package uses:
- `chatkit.server.ChatKitServer` (not `openai_chatkit`)
- `chatkit.store.Store` (abstract base class)
- `chatkit.store.AttachmentStore` (abstract base class)
- `chatkit.types` for type definitions
- Uses `agents` package for agent functionality

### What We Coded For

The code in `chatkit_server.py` was written for:
- `openai_chatkit.ChatKitServer`
- `openai_chatkit.stores.SQLiteStore`, `DiskFileStore`
- `openai_chatkit.types.*`
- `openai_chatkit.tools.function_tool`
- `openai_chatkit.context.RunContextWrapper`

### Next Steps

1. **Option A**: Rewrite `chatkit_server.py` to match the actual API
2. **Option B**: Check if there's a different package/version that matches our code
3. **Option C**: Implement custom Store classes that match the abstract base classes

### Current Status

- ✅ Python 3.14 installed
- ✅ ChatKit package installed from GitHub
- ❌ Server code needs to be updated to match actual API

