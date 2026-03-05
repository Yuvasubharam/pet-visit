# 🎉 Grooming Store Self-Registration Guide

## Overview

Grooming store owners can now **register their own accounts** without needing admin assistance! The registration process is simple, secure, and creates a complete grooming store profile automatically.

---

## 🚀 How to Register a New Grooming Store

### **User Flow:**

1. **Navigate to Registration**
   - Open the app
   - Go to: Onboarding → Doctor Login → "Login as Grooming Store"
   - Click **"Register Store"** button

2. **Step 1: Basic Information**
   Fill in the following details:
   - **Store Name** (e.g., "Paws & Claws Grooming")
   - **Email Address** (for login)
   - **Phone Number** (contact for customers)
   - **Password** (min 6 characters)
   - **Confirm Password**

   Click **"Next: Store Location"**

3. **Step 2: Store Location**
   Provide your store's address:
   - **Store Address** (street address)
   - **City**
   - **State**
   - **Pincode**

   Click **"Create Store Account"**

4. **Email Verification**
   - Check your email inbox
   - Click the verification link from Supabase
   - Verify your account

5. **Login**
   - Return to the app
   - Click "Login"
   - Enter your email and password
   - Access your dashboard!

---

## ✨ What Gets Created Automatically

When you register, the system automatically:

1. **Creates Auth Account** - Secure login credentials in Supabase Auth
2. **Creates Store Profile** - Entry in `grooming_stores` table with all your info
3. **Sets User Type** - Marks account as 'grooming_store' type
4. **Activates Store** - Sets `is_active = true` so you appear in clinic listings
5. **Grants Permissions** - Applies Row Level Security policies for data access

---

## 🎯 After Registration

### **What You Can Do:**

✅ **Login to Store Portal**
- Access your dedicated dashboard
- View real-time statistics

✅ **Add Grooming Packages**
- Create Basic, Full, and Luxury packages
- Set your own prices
- Define service duration

✅ **Manage Bookings**
- View all customer bookings
- Update booking status (Complete/Cancel)
- Filter by status and type

✅ **Appear in Clinic Listings**
- Users can see your store when booking clinic visits
- Your address and contact info is displayed
- Your packages are shown with pricing

✅ **Track Earnings**
- View total earnings (95% of bookings)
- Monitor pending payouts
- See platform commission (5%)

---

## 📋 Registration Form Fields

### **Required Fields (Step 1):**
| Field | Description | Example |
|-------|-------------|---------|
| Store Name * | Your grooming business name | "Paws & Claws Grooming" |
| Email * | Login email (must be unique) | "store@example.com" |
| Phone * | Contact number for customers | "+91-9876543210" |
| Password * | Secure password (min 6 chars) | "MySecure123!" |
| Confirm Password * | Must match password | "MySecure123!" |

### **Required Fields (Step 2):**
| Field | Description | Example |
|-------|-------------|---------|
| Store Address * | Full street address | "123 Pet Street, Near Park" |
| City * | City name | "Bangalore" |
| State * | State name | "Karnataka" |
| Pincode * | Postal code | "560001" |

**Note:** All fields marked with * are required

---

## 🔒 Security Features

### **Account Security:**
- ✅ Password must be at least 6 characters
- ✅ Email verification required
- ✅ Unique email addresses only
- ✅ Secure password hashing by Supabase Auth

### **Data Privacy:**
- ✅ Row Level Security (RLS) enabled
- ✅ Store owners can only see their own data
- ✅ No access to user accounts or other stores
- ✅ Secure API endpoints

---

## 🛠️ Technical Details

### **What Happens Behind the Scenes:**

1. **Auth User Creation:**
   ```javascript
   supabase.auth.signUp({
     email: email,
     password: password,
     options: {
       data: {
         user_type: 'grooming_store',
         store_name: storeName
       }
     }
   })
   ```

2. **Store Profile Creation:**
   ```javascript
   groomingStoreAuthService.createGroomingStoreProfile(userId, {
     store_name, email, phone,
     address, city, state, pincode
   })
   ```

3. **Database Insert:**
   ```sql
   INSERT INTO grooming_stores (
     user_id, store_name, email, phone,
     address, city, state, pincode,
     is_active
   ) VALUES (
     'auth-user-id', 'Store Name', 'email@example.com', 'phone',
     'address', 'city', 'state', 'pincode',
     true
   )
   ```

---

## ❓ Common Questions

### **Q: Do I need to be approved before I can use the system?**
A: No! Your store is automatically activated (`is_active = true`) and appears in clinic listings immediately after registration.

### **Q: What if I enter the wrong email?**
A: You can register a new account with a different email. Each email can only be used once.

### **Q: Can I change my store information later?**
A: Yes! After logging in, go to Dashboard → Store Settings to update your store name, phone, address, etc.

### **Q: How do I add grooming packages?**
A: After logging in, go to Dashboard → Manage Packages → Add New Package.

### **Q: When will customers see my store?**
A: Immediately! Your store appears in the clinic selection list as soon as you complete registration.

### **Q: What if I forget my password?**
A: Click "Forgot Password?" on the login page to reset it via email.

### **Q: Can I register multiple stores?**
A: Yes, but each store needs a unique email address. You can create multiple accounts.

---

## 🐛 Troubleshooting

### **"Email already exists" error**
- This email is already registered
- Try a different email or use "Forgot Password"

### **"Failed to create user account" error**
- Check your internet connection
- Ensure email format is valid
- Make sure password meets requirements (min 6 chars)

### **Email verification not received**
- Check spam/junk folder
- Wait a few minutes (delivery can be delayed)
- Try resending from login page

### **Can't login after registration**
- Make sure you verified your email first
- Check that you're using the correct email/password
- Try resetting your password

---

## 📱 Navigation Flow

```
App Opens
  ↓
Onboarding
  ↓
Doctor Login
  ↓
"Login as Grooming Store" button
  ↓
Grooming Store Login
  ↓
"Register Store" button
  ↓
Registration Form (Step 1: Basic Info)
  ↓
Registration Form (Step 2: Location)
  ↓
Email Verification
  ↓
Back to Login
  ↓
Enter Credentials
  ↓
Grooming Store Dashboard ✨
```

---

## 🎨 Files Created/Updated

### **New Files:**
- `pages/GroomingStoreRegister.tsx` - Registration page with 2-step form

### **Updated Files:**
- `pages/GroomingStoreLogin.tsx` - Added "Register Store" link
- `App.tsx` - Added registration route
- `types.ts` - Added 'grooming-store-register' view type

---

## 🎯 Next Steps After Registration

1. ✅ **Login** to your store dashboard
2. ✅ **Add Packages** - Create at least one grooming package
3. ✅ **Test Booking** - Ask a friend to book at your clinic
4. ✅ **Manage Bookings** - Practice updating booking status
5. ✅ **Customize** - Update store info as needed

---

## 💡 Tips for Success

### **For Better Visibility:**
- ✅ Use a clear, professional store name
- ✅ Provide complete address with landmarks
- ✅ Keep phone number up to date
- ✅ Add multiple package options (Basic, Full, Luxury)
- ✅ Price competitively

### **For Better Customer Experience:**
- ✅ Respond quickly to bookings
- ✅ Keep your availability updated
- ✅ Provide detailed package descriptions
- ✅ Mark bookings as complete promptly
- ✅ Maintain good service quality

---

## 🚀 Quick Start Checklist

- [ ] Navigate to registration page
- [ ] Fill Step 1: Store name, email, phone, password
- [ ] Fill Step 2: Address, city, state, pincode
- [ ] Submit registration
- [ ] Check email and verify account
- [ ] Login with credentials
- [ ] Add your first grooming package
- [ ] Update store settings if needed
- [ ] You're ready to receive bookings! 🎉

---

## 📞 Support

Need help with registration?

1. Check this guide first
2. Verify all required fields are filled
3. Ensure email format is valid
4. Check spam folder for verification email
5. Try a different email if needed

**Note:** Registration is completely self-service - no admin approval needed!

---

## 🎉 Success!

Congratulations! You can now:
- ✅ Register your grooming store in 2 minutes
- ✅ Start accepting bookings immediately
- ✅ Manage all operations from your dashboard
- ✅ Track earnings and statistics
- ✅ Grow your grooming business!

**Welcome to the Furora Care Grooming Network! 🐕🐈**

---

## 📊 What's Included

Your registration includes:

| Feature | Included | Notes |
|---------|----------|-------|
| Store Dashboard | ✅ Yes | Real-time stats |
| Booking Management | ✅ Yes | All bookings |
| Package Management | ✅ Yes | Unlimited packages |
| Earnings Tracking | ✅ Yes | 95% of bookings |
| Clinic Listing | ✅ Yes | Visible to all users |
| Mobile Access | ✅ Yes | Works on all devices |
| Customer Support | ✅ Yes | Help available |
| Commission | 5% | Platform fee |

**Everything you need to run your grooming business! 🚀**
