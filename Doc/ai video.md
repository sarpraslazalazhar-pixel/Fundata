Ini gambar ilustrasi watercolor seorang anak laki-laki — gaya artnya khas dan konsisten, jadi supaya AI animasi nggak "merusak" gaya gambar aslinya, kuncinya adalah prompt yang eksplisit mempertahankan art style sambil hanya mengubah ekspresi/gerakan.

Berikut prompt untuk masing-masing ekspresi, dirancang untuk tools image-to-video/animasi AI (seperti Runway, Pika, Kling, atau image-to-image untuk frame ekspresi):

## Prompt Dasar (base style lock — sertakan di SEMUA prompt)

```
Keep the exact same watercolor illustration art style, same character design, 
same messy black hair, same outfit (dark olive green t-shirt), same line art 
thickness, same soft watercolor shading and pink cheek blush. Do not change 
proportions, do not change hairstyle, do not change clothing. Only animate 
facial expression and subtle head/body movement.
```

## 1. Sedang Berbicara (Talking)

```
Animate the boy's mouth moving naturally as if speaking, subtle lip sync 
movement, slight head tilt movements, eyes blinking naturally every few 
seconds, maintain the exact same watercolor art style and character design.
```

## 2. Bingung (Confused)

```
Animate the boy tilting his head slightly to one side, eyebrows raising 
asymmetrically (one up, one furrowed), eyes looking slightly to the side, 
mouth slightly open in a puzzled expression, maintain the exact same 
watercolor art style and character design.
```

## 3. Marah (Angry)

```
Animate the boy's eyebrows lowering and furrowing inward, eyes narrowing 
slightly, mouth pressing into a tight frown or slight downward curve, 
subtle shoulder tension, maintain the exact same watercolor art style 
and character design.
```

## 4. Sedih (Sad)

```
Animate the boy's eyebrows raising slightly at the inner corners, eyes 
becoming slightly downcast, mouth curving gently downward, head tilting 
slightly down, maintain the exact same watercolor art style and 
character design.
```

## 5. Senang (Happy)

```
Animate the boy's eyes turning into a gentle smiling curve, mouth 
curving upward into a warm smile, cheeks blush intensifying slightly, 
subtle bouncy head movement, maintain the exact same watercolor art 
style and character design.
```

## 6. Semangat (Excited/Energetic)

```
Animate the boy with wide bright eyes, big open smile showing 
enthusiasm, eyebrows raised, slight forward head movement and energetic 
subtle body bounce, maintain the exact same watercolor art style and 
character design.
```

**Tips tambahan:**

- Kalau pakai tools seperti **Runway Gen-3** atau **Kling**, tambahkan negative prompt: `no style change, no redraw, no different art style, no distortion, no extra limbs`
- Untuk hasil terbaik, gunakan gambar ini sebagai **reference/first frame image** (image-to-video), bukan text-to-video murni, supaya gaya gambar tetap terjaga
- Jika hasil animasi mulai "melenceng" dari gaya asli, gunakan strength/motion intensity yang rendah (sekitar 20-40%) agar perubahan tidak drastis

Mau saya bantu buatkan versi prompt yang lebih spesifik untuk tools tertentu (misal khusus Kling AI, Runway, atau Pika Labs)?