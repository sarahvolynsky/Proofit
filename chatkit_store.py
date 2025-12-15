"""
Simple Store implementation for ChatKit using SQLite
"""
import sqlite3
import json
import os
from typing import Any
from chatkit.store import Store, AttachmentStore, StoreItemType
from chatkit.types import ThreadMetadata, ThreadItem, Attachment


class SQLiteStore(Store[dict]):
    """SQLite-based Store implementation for ChatKit"""
    
    def __init__(self, db_path: str = "./chatkit_data/chatkit.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_db()
    
    def _init_db(self):
        """Initialize the database schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Threads table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS threads (
                id TEXT PRIMARY KEY,
                metadata TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        
        # Thread items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS thread_items (
                id TEXT PRIMARY KEY,
                thread_id TEXT,
                item_type TEXT,
                content TEXT,
                created_at TEXT,
                FOREIGN KEY (thread_id) REFERENCES threads(id)
            )
        """)
        
        # Attachments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attachments (
                id TEXT PRIMARY KEY,
                metadata TEXT,
                created_at TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    async def generate_thread_id(self, context: dict) -> str:
        """Generate a new thread ID"""
        import uuid
        return f"thread_{uuid.uuid4().hex[:16]}"
    
    def generate_item_id(self, item_type: StoreItemType, thread: ThreadMetadata, context: dict) -> str:
        """Generate a new item ID"""
        import uuid
        prefix = item_type.value if hasattr(item_type, 'value') else str(item_type)
        return f"{prefix}_{uuid.uuid4().hex[:16]}"
    
    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        """Save thread metadata"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO threads (id, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        """, (
            thread.id,
            json.dumps(thread.metadata or {}),
            thread.created_at.isoformat() if hasattr(thread, 'created_at') and thread.created_at else None,
            thread.updated_at.isoformat() if hasattr(thread, 'updated_at') and thread.updated_at else None
        ))
        conn.commit()
        conn.close()
    
    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
        """Load thread metadata"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, metadata, created_at, updated_at FROM threads WHERE id = ?", (thread_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise ValueError(f"Thread {thread_id} not found")
        
        from datetime import datetime
        return ThreadMetadata(
            id=row[0],
            metadata=json.loads(row[1]) if row[1] else {},
            created_at=datetime.fromisoformat(row[2]) if row[2] else None,
            updated_at=datetime.fromisoformat(row[3]) if row[3] else None
        )
    
    async def load_threads(self, context: dict, limit: int = 100, after: str | None = None) -> list[ThreadMetadata]:
        """Load threads"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        query = "SELECT id, metadata, created_at, updated_at FROM threads ORDER BY updated_at DESC LIMIT ?"
        params = [limit]
        if after:
            query = "SELECT id, metadata, created_at, updated_at FROM threads WHERE id > ? ORDER BY updated_at DESC LIMIT ?"
            params = [after, limit]
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        from datetime import datetime
        return [
            ThreadMetadata(
                id=row[0],
                metadata=json.loads(row[1]) if row[1] else {},
                created_at=datetime.fromisoformat(row[2]) if row[2] else None,
                updated_at=datetime.fromisoformat(row[3]) if row[3] else None
            )
            for row in rows
        ]
    
    async def delete_thread(self, thread_id: str, context: dict) -> None:
        """Delete a thread"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM thread_items WHERE thread_id = ?", (thread_id,))
        cursor.execute("DELETE FROM threads WHERE id = ?", (thread_id,))
        conn.commit()
        conn.close()
    
    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        """Save a thread item"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO thread_items (id, thread_id, item_type, content, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            item.id,
            thread_id,
            item.type,
            json.dumps(item.model_dump() if hasattr(item, 'model_dump') else item.dict()),
            item.created_at.isoformat() if hasattr(item, 'created_at') and item.created_at else None
        ))
        conn.commit()
        conn.close()
    
    async def load_item(self, thread_id: str, item_id: str, context: dict) -> ThreadItem:
        """Load a thread item"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, item_type, content FROM thread_items WHERE id = ? AND thread_id = ?", (item_id, thread_id))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise ValueError(f"Item {item_id} not found in thread {thread_id}")
        
        # Reconstruct ThreadItem from JSON
        item_data = json.loads(row[2])
        # This is a simplified version - you may need to reconstruct based on item_type
        from chatkit.types import ThreadItem
        return ThreadItem(**item_data)
    
    async def load_thread_items(self, thread_id: str, context: dict, limit: int = 100, after: str | None = None) -> list[ThreadItem]:
        """Load thread items"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        query = "SELECT id, item_type, content FROM thread_items WHERE thread_id = ? ORDER BY created_at ASC LIMIT ?"
        params = [thread_id, limit]
        if after:
            query = "SELECT id, item_type, content FROM thread_items WHERE thread_id = ? AND id > ? ORDER BY created_at ASC LIMIT ?"
            params = [thread_id, after, limit]
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        items = []
        for row in rows:
            item_data = json.loads(row[2])
            from chatkit.types import ThreadItem
            items.append(ThreadItem(**item_data))
        
        return items
    
    async def delete_thread_item(self, thread_id: str, item_id: str, context: dict) -> None:
        """Delete a thread item"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM thread_items WHERE id = ? AND thread_id = ?", (item_id, thread_id))
        conn.commit()
        conn.close()
    
    async def add_thread_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        """Add a new thread item"""
        await self.save_item(thread_id, item, context)
    
    # Attachment methods are not part of Store - they're in AttachmentStore
    # These are stubs to satisfy the abstract base class if needed
    async def save_attachment(self, attachment: Attachment, context: dict) -> None:
        """Not implemented - use AttachmentStore"""
        raise NotImplementedError("Use AttachmentStore for attachments")
    
    async def load_attachment(self, attachment_id: str, context: dict) -> Attachment:
        """Not implemented - use AttachmentStore"""
        raise NotImplementedError("Use AttachmentStore for attachments")
    
    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        """Not implemented - use AttachmentStore"""
        raise NotImplementedError("Use AttachmentStore for attachments")


class SQLiteAttachmentStore(AttachmentStore[dict]):
    """SQLite-based AttachmentStore implementation"""
    
    def __init__(self, db_path: str = "./chatkit_data/chatkit.db", base_path: str = "./chatkit_files"):
        self.db_path = db_path
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
        self._init_db()
    
    def _init_db(self):
        """Initialize attachments table"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attachments (
                id TEXT PRIMARY KEY,
                metadata TEXT,
                file_path TEXT,
                created_at TEXT
            )
        """)
        conn.commit()
        conn.close()
    
    async def save_attachment(self, attachment: Attachment, context: dict) -> None:
        """Save attachment metadata"""
        import uuid
        from datetime import datetime
        
        if not attachment.id:
            attachment.id = f"file_{uuid.uuid4().hex[:16]}"
        
        # Save file to disk if content provided
        file_path = None
        if hasattr(attachment, 'content') and attachment.content:
            file_path = os.path.join(self.base_path, attachment.id)
            with open(file_path, 'wb') as f:
                if isinstance(attachment.content, bytes):
                    f.write(attachment.content)
                else:
                    f.write(attachment.content.encode())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO attachments (id, metadata, file_path, created_at)
            VALUES (?, ?, ?, ?)
        """, (
            attachment.id,
            json.dumps(attachment.model_dump() if hasattr(attachment, 'model_dump') else attachment.dict()),
            file_path,
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()
    
    async def load_attachment(self, attachment_id: str, context: dict) -> Attachment:
        """Load attachment metadata"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, metadata, file_path FROM attachments WHERE id = ?", (attachment_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise ValueError(f"Attachment {attachment_id} not found")
        
        attachment_data = json.loads(row[1])
        from chatkit.types import Attachment
        return Attachment(**attachment_data)
    
    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        """Delete an attachment"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT file_path FROM attachments WHERE id = ?", (attachment_id,))
        row = cursor.fetchone()
        if row and row[0]:
            try:
                os.remove(row[0])
            except:
                pass
        cursor.execute("DELETE FROM attachments WHERE id = ?", (attachment_id,))
        conn.commit()
        conn.close()

