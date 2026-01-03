# Quick Setup: Clinic Location Feature

## 🚀 Get Started in 2 Minutes

### Step 1: Add Database Columns (30 seconds)

Open Supabase Dashboard → SQL Editor → Run this:

```sql
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS clinic_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS clinic_longitude NUMERIC(11, 8);
```

### Step 2: Test It! (1 minute)

1. Run your app: `npm run dev`
2. Login as a doctor
3. Go to **Profile Setup**
4. Click **"Select Clinic Location"**
5. Search for your clinic or use GPS
6. Save and update profile

### Step 3: Verify (30 seconds)

Check Supabase → Table Editor → doctors table:
- `clinic_latitude` column should have your latitude
- `clinic_longitude` column should have your longitude

---

## ✨ What You Get

### Interactive Map Picker
- 🗺️ Full OpenStreetMap integration
- 🔍 Search any address worldwide
- 📍 GPS current location support
- ⬆️⬇️⬅️➡️ Arrow navigation
- 🎯 Real-time pin placement

### Smart Features
- Auto-fill address from coordinates
- Map preview on profile page
- Edit/update anytime
- Optional (can skip)

---

## 📋 Files Created/Modified

### New Files
- ✅ `components/ClinicLocationPicker.tsx` - Main location picker component
- ✅ `ADD_DOCTOR_COORDINATES.sql` - Database migration
- ✅ `CLINIC_LOCATION_FEATURE_GUIDE.md` - Detailed docs
- ✅ `SETUP_CLINIC_LOCATION.md` - This file

### Modified Files
- ✅ `types.ts` - Added `clinic_latitude` & `clinic_longitude` to Doctor interface
- ✅ `pages/DoctorProfileSetup.tsx` - Integrated location picker
- ✅ `services/doctorApi.ts` - Handle coordinate updates

---

## 🎨 UI Preview

### Before Location Set
```
┌─────────────────────────────────────┐
│ Select Clinic Location              │
│ 📍 Pin your clinic on the map       │
│                                   › │
└─────────────────────────────────────┘
```

### After Location Set
```
┌─────────────────────────────────────┐
│     [Map Preview with Pin]          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Update Clinic Location              │
│ 📍 28.613900, 77.209000             │
│                                   › │
└─────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal not opening | Check browser console, refresh page |
| Map blank | Check internet, try different network |
| GPS not working | Enable location in browser settings |
| Can't save | Run SQL migration first |
| Search no results | Type 3+ characters, be specific |

---

## 📱 How Doctors Use It

1. **First Time Setup**:
   - Doctor registers → Goes to Profile Setup
   - Clicks "Select Clinic Location"
   - Searches "New York Veterinary Clinic"
   - Selects from results → Pin appears
   - Clicks "Save Location" → Coordinates saved

2. **Update Location**:
   - Doctor moves clinic → Opens Profile Setup
   - Clicks "Update Clinic Location"
   - Uses arrow keys to fine-tune position
   - Saves and updates profile

3. **Use GPS**:
   - Doctor at clinic → Opens Profile Setup
   - Clicks "Select Clinic Location"
   - Clicks "Use Current Location"
   - Allows browser permission
   - Coordinates auto-detected → Save

---

## 🌟 Pro Tips

- **Accuracy**: Use arrow keys for precise positioning
- **Search**: Try "clinic name + city" for best results
- **GPS**: Stand at clinic entrance for exact location
- **Address**: Auto-filled but can add details
- **Preview**: Click map preview to update location

---

## ✅ Checklist

- [ ] Run `ADD_DOCTOR_COORDINATES.sql` in Supabase
- [ ] Test opening location picker
- [ ] Try search functionality
- [ ] Test GPS detection
- [ ] Save a location
- [ ] Verify in database
- [ ] Check map preview appears

---

**That's it!** Your clinic location feature is ready to use.

For detailed documentation, see [CLINIC_LOCATION_FEATURE_GUIDE.md](CLINIC_LOCATION_FEATURE_GUIDE.md)
