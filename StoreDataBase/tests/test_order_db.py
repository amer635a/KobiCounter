# StoreDataBase/tests/test_order_db.py
import unittest
import os
import sys
import sqlite3 
from datetime import datetime
 

# Import from DBManager (since your file is named DBManager.py)
from DBManager import OrderDBManager

class TestOrderDBManager(unittest.TestCase):
    TEST_DB = "test_orders.db"
    
    def setUp(self):
        """Initialize fresh database before each test"""
        if os.path.exists(self.TEST_DB):
            os.remove(self.TEST_DB)
        self.db = OrderDBManager(self.TEST_DB)
    
    def tearDown(self):
        """Clean up after each test"""
        if os.path.exists(self.TEST_DB):
            os.remove(self.TEST_DB)
    
    def test_database_creation(self):
        """Test database file is created"""
        self.assertTrue(os.path.exists(self.TEST_DB))
        
        # Verify tables exist
        with sqlite3.connect(self.TEST_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = {row[0] for row in cursor.fetchall()}
            self.assertIn('orders', tables)
    
    def test_add_and_retrieve_order(self):
        """Test adding and retrieving orders"""
        # Add with datetime object
        test_date = datetime(2023, 6, 15)
        self.db.add_order(test_date, 'make', 100.0)
        
        # Add with string date
        self.db.add_order('16/06/2023', 'sell', 50.0)
        
        # Get all orders
        orders = self.db.get_orders()
        self.assertEqual(len(orders), 2)
        
        # Verify first order
        self.assertEqual(orders[0][0], '15/06/2023')
        self.assertEqual(orders[0][1], 'make')
        self.assertEqual(orders[0][2], 100.0)
    
    def test_amount_accumulation(self):
        """Test amounts accumulate for same date/status"""
        self.db.add_order('15/06/2023', 'make', 100.0)
        self.db.add_order('15/06/2023', 'make', 50.0)
        
        orders = self.db.get_orders(status='make')
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0][2], 150.0)
    
    def test_negative_amounts(self):
        """Test handling of negative amounts"""
        self.db.add_order('15/06/2023', 'make', 200.0)
        self.db.add_order('15/06/2023', 'make', -50.0)
        
        orders = self.db.get_orders(status='make')
        self.assertEqual(orders[0][2], 150.0)
    
    def test_order_deletion(self):
        """Test deleting orders"""
        self.db.add_order('15/06/2023', 'make', 100.0)
        self.db.add_order('15/06/2023', 'sell', 50.0)
        
        # Delete make order
        deleted = self.db.delete_order('15/06/2023', 'make')
        self.assertTrue(deleted)
        self.assertEqual(len(self.db.get_orders()), 1)
        
        # Verify remaining order
        remaining = self.db.get_orders()[0]
        self.assertEqual(remaining[1], 'sell')
    
    def test_invalid_inputs(self):
        """Test error handling"""
        with self.assertRaises(ValueError):
            self.db.add_order('2023-06-15', 'make', 100.0)  # Wrong date format
            
        with self.assertRaises(ValueError):
            self.db.add_order('15/06/2023', 'invalid', 100.0)  # Invalid status

if __name__ == '__main__':
    unittest.main()