import sqlite3
from sqlite3 import Error

# Create a connection to a database (creates the file if it doesn't exist)
def create_connection():
    conn = None
    try:
        conn = sqlite3.connect('example.db')  # Creates or opens database file
        print(f"Connected to SQLite version {sqlite3.version}")
        return conn
    except Error as e:
        print(e)
    return conn

# Create a table
def create_table(conn):
    try:
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            age INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        print("Table created successfully")
    except Error as e:
        print(e)

# Insert data
def insert_user(conn, name, email, age):
    sql = '''INSERT INTO users(name, email, age) VALUES(?,?,?)'''
    cursor = conn.cursor()
    cursor.execute(sql, (name, email, age))
    conn.commit()
    return cursor.lastrowid

# Query data
def select_all_users(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    for row in rows:
        print(row)

# Update data
def update_user(conn, user_id, new_age):
    sql = '''UPDATE users SET age = ? WHERE id = ?'''
    cursor = conn.cursor()
    cursor.execute(sql, (new_age, user_id))
    conn.commit()
    print(f"Updated user {user_id}")

# Delete data
def delete_user(conn, user_id):
    sql = '''DELETE FROM users WHERE id = ?'''
    cursor = conn.cursor()
    cursor.execute(sql, (user_id,))
    conn.commit()
    print(f"Deleted user {user_id}")

# Main program
def main():
    # Create database connection
    conn = create_connection()
    
    if conn is not None:
        # Create table
        create_table(conn)
        
        # Insert some users
        insert_user(conn, "John Doe", "john@example.com", 30)
        insert_user(conn, "Jane Smith", "jane@example.com", 25)
        
        # Query all users
        print("\nAll users:")
        select_all_users(conn)
        
        # Update a user
        update_user(conn, 1, 31)
        
        # Query again
        print("\nAfter update:")
        select_all_users(conn)
        
        # Delete a user
        delete_user(conn, 2)
        
        # Final query
        print("\nAfter deletion:")
        select_all_users(conn)
        
        # Close connection
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()