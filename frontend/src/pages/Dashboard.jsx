import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ title: '', description: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        } else {
            fetchItems(1);
        }
    }, [search]);

    useEffect(() => {
        fetchItems(page);
    }, [page]);

    const fetchItems = async (targetPage = page) => {
        try {
            const endpoint = search
                ? `/items/search?q=${encodeURIComponent(search)}&page=${targetPage}&limit=10`
                : `/items?page=${targetPage}&limit=10`;
            const response = await axios.get(`${API_URL}${endpoint}`);

            // Defensive: ensure we have an array, or fallback to response.data if it's the old format
            const data = response.data.items || (Array.isArray(response.data) ? response.data : []);
            setItems(data);
            setTotalPages(response.data.pages || 1);
        } catch (error) {
            console.error('Error fetching items:', error);
            setItems([]);
        }
    };

    const addItem = async (e) => {
        e.preventDefault();
        if (!newItem.title) return;
        try {
            await axios.post(`${API_URL}/items`, newItem);
            setNewItem({ title: '', description: '' });
            setPage(1);
            fetchItems(1);
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const deleteItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await axios.delete(`${API_URL}/items/${id}`);
            fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white shadow p-4 flex justify-between items-center">
                <span className="font-bold text-xl text-blue-600">Mina App</span>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.username}</span>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto p-8 flex-grow w-full">
                {/* Helper to add items */}
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
                    <form onSubmit={addItem} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Title"
                            value={newItem.title}
                            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <textarea
                            placeholder="Description (Optional)"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                            Add Item
                        </button>
                    </form>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search your items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* List */}
                <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-start hover:shadow-md transition-shadow">
                            <div className="overflow-hidden">
                                <h4 className="font-bold text-lg truncate" title={item.title}>{item.title}</h4>
                                <p className="text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                            </div>
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                title="Delete Item"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                {/* No items state */}
                {items.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No items found. Try adding some!
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-white border-t p-4 sticky bottom-0 flex justify-center items-center gap-6">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={`px-4 py-2 rounded border ${page === 1 ? 'text-gray-300 border-gray-100' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                    >
                        Previous
                    </button>
                    <span className="text-gray-600 font-medium">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className={`px-4 py-2 rounded border ${page === totalPages ? 'text-gray-300 border-gray-100' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
