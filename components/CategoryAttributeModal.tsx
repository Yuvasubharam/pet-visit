import React, { useState, useEffect } from 'react';
import { adminCategoryAttributeService } from '../services/adminApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CategoryAttributeModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'attributes'>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [newAttribute, setNewAttribute] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadAttributes();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const data = await adminCategoryAttributeService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Failed to load categories');
    }
  };

  const loadAttributes = async () => {
    try {
      const data = await adminCategoryAttributeService.getAllAttributeNames();
      setAttributes(data);
    } catch (error) {
      console.error('Error loading attributes:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      await adminCategoryAttributeService.createCategory({
        name: newCategory,
        description: newCategoryDesc,
        icon: newCategoryIcon,
        display_order: categories.length,
      });
      
      setNewCategory('');
      setNewCategoryDesc('');
      setNewCategoryIcon('');
      await loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      setLoading(true);
      await adminCategoryAttributeService.deleteCategory(categoryId);
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('attributes')}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'attributes'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Attributes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'categories' ? (
            <div className="p-6 space-y-4">
              {/* Add Category Form */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white">Add New Category</h3>
                
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                
                <input
                  type="text"
                  placeholder="Icon name (e.g., pets, restaurant)"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                
                <button
                  onClick={handleAddCategory}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Category'}
                </button>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Categories ({categories.length})</h3>
                {categories.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No categories yet</p>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {cat.icon && <span className="material-symbols-outlined text-lg">{cat.icon}</span>}
                          {cat.name}
                        </p>
                        {cat.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cat.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Attribute names used in the system. Manage individual product attributes when editing products.
              </p>
              
              {attributes.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No attributes yet</p>
              ) : (
                <div className="space-y-2">
                  {attributes.map((attr) => (
                    <div
                      key={attr}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <span className="material-symbols-outlined text-slate-400">tag</span>
                      <p className="font-medium text-slate-900 dark:text-white">{attr}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryAttributeModal;
