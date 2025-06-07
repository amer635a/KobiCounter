import sqlite3
from datetime import datetime
from typing import List, Tuple, Optional, Union, Dict
import os

class OrderDBManager:
    """
    A comprehensive database controller for managing orders with date-based accumulation.
    Now includes order history tracking.
    """

    def __init__(self, db_path: str = 'orders.db'):
        self.db_path = db_path
        self._initialize_db()

    def _get_connection(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _initialize_db(self) -> None:
        is_new_db = not os.path.exists(self.db_path)
        
        try:
            with self._get_connection() as conn:
                conn.execute("PRAGMA journal_mode=WAL")
                
                # Main orders table
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS orders (
                        order_date TEXT NOT NULL,
                        status TEXT NOT NULL,
                        amount REAL NOT NULL,
                        PRIMARY KEY (order_date, status),
                        CHECK (status IN ('make', 'sell'))
                    )
                ''')
                
                # Order history table (id is ISO string)
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS orderhistory (
                        id TEXT PRIMARY KEY, -- ISO string as unique id
                        iso_date TEXT NOT NULL,  -- ISO date string
                        amount REAL NOT NULL,
                        status TEXT NOT NULL,
                        CHECK (status IN ('make', 'sell'))
                    )
                ''')
                
                if is_new_db:
                    conn.execute('''
                        INSERT INTO db_meta (key, value)
                        VALUES ('version', '2.1'), ('created_at', CURRENT_TIMESTAMP)
                    ''')
                conn.commit()
        except sqlite3.Error as e:
            raise RuntimeError(f"Database initialization failed: {str(e)}")

    def _parse_date(self, date_val: Union[str, datetime]) -> Tuple[str, str]:
        """
        Returns (dd/mm/yyyy, ISO string) from input date (ISO string or datetime)
        """
        if isinstance(date_val, datetime):
            iso_str = date_val.isoformat()
            ddmmyyyy = date_val.strftime('%d/%m/%Y')
        else:
            try:
                dt = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
            except Exception:
                raise ValueError(f"Invalid date format: {date_val}")
            iso_str = dt.isoformat()
            ddmmyyyy = dt.strftime('%d/%m/%Y')
        return ddmmyyyy, iso_str

    def _log_history(self, iso_date: str, amount: float, status: str) -> None:
        """Log an action to the history table with ISO date as id"""
        with self._get_connection() as conn:
            conn.execute('''
                INSERT OR REPLACE INTO orderhistory (id, iso_date, amount, status)
                VALUES (?, ?, ?, ?)
            ''', (iso_date, iso_date, amount, status))
            conn.commit()

    def add_order(self, order_date: Union[datetime, str], status: str, amount: float) -> None:
        status = status.lower()
        if status not in ('make', 'sell'):
            raise ValueError("Status must be either 'make' or 'sell'")

        ddmmyyyy, iso_str = self._parse_date(order_date)
        try:
            with self._get_connection() as conn:
                conn.execute('''
                    INSERT INTO orders (order_date, status, amount)
                    VALUES (?, ?, ?)
                    ON CONFLICT(order_date, status) DO UPDATE 
                    SET amount = amount + excluded.amount
                ''', (ddmmyyyy, status, amount))
                conn.commit()
                self._log_history(iso_str, amount, status)
        except sqlite3.Error as e:
            raise RuntimeError(f"Failed to add order: {str(e)}")

    def get_order_history(self) -> List[Tuple[str, float, str]]:
        """Retrieve all history records (iso_date, amount, status)"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT iso_date, amount, status 
                    FROM orderhistory 
                    ORDER BY iso_date DESC
                ''')
                return cursor.fetchall()
        except sqlite3.Error as e:
            raise RuntimeError(f"Failed to fetch history: {str(e)}")

    def print_order_history(self):
        """Prints the order history in a formatted table"""
        history = self.get_order_history()
        
        if not history:
            print("No history records found.")
            return
        print("\n{:<27} {:<10} {:<8}".format("ISO Date", "Amount", "Status"))
        print("-" * 50)
        for record in history:
            iso_date, amount, status = record
            print("{:<27} {:<10.2f} {:<8}".format(iso_date, amount, status))
 
    def delete_order_history_and_update_order(self, item_id: str) -> None:
        """
        Delete a row from orderhistory by id (ISO string, e.g. 2025-06-07T07:39:51.010000Z),
        subtract the amount from orders table (using dd/mm/yyyy),
        and delete the order row if amount <= 0.
        """
        # Convert item_id (ISO string with Z) to the format stored in orderhistory
        iso_id = item_id
        if iso_id.endswith('Z'):
            iso_id = iso_id[:-1] + '+00:00'
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT iso_date, amount, status FROM orderhistory WHERE id = ?", (iso_id,))
            row = cursor.fetchone()
            if not row:
                raise Exception("Item not found in history.")
            iso_date, amount, status = row
            from datetime import datetime
            dt = datetime.fromisoformat(iso_date)
            ddmmyyyy = dt.strftime('%d/%m/%Y')
            cursor.execute(
                "UPDATE orders SET amount = amount - ? WHERE order_date = ? AND status = ?",
                (amount, ddmmyyyy, status)
            )
            cursor.execute("DELETE FROM orders WHERE amount <= 0")
            cursor.execute("DELETE FROM orderhistory WHERE id = ?", (iso_id,))
            conn.commit()

def print_orders_table(db_manager: OrderDBManager):
    """Prints the current contents of the orders table in a formatted table"""
    try:
        with db_manager._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT order_date, status, amount FROM orders
                ORDER BY order_date DESC, status
            ''')
            orders = cursor.fetchall()
            if not orders:
                print("No orders found.")
                return
            print("{:<12} {:<8} {:<10}".format("Date", "Status", "Amount"))
            print("-" * 32)
            for order in orders:
                date, status, amount = order
                print("{:<12} {:<8} {:<10.2f}".format(date, status, amount))
    except Exception as e:
        print(f"Error printing orders table: {e}")

def main():
    # Initialize the database manager
    db_manager = OrderDBManager()
    
    # Print the current contents of the orders table
    print("Current Orders in Database:")
    print_orders_table(db_manager)
    
    # Print the order history
    print("\nOrder History:")
    db_manager.print_order_history()

if __name__ == "__main__":
    main()