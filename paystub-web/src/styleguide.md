# Style Guide: Paystub Web Application

**Design Trend:** Minimalism with Subtle Neumorphism

**Justification:**

*   **Minimalism:** Prioritizes essential content, reduces clutter, and enhances usability, which is crucial for data-heavy applications.
*   **Subtle Neumorphism:** Adds a modern, tactile feel without compromising accessibility when used sparingly for depth and emphasis.
*   **Accessibility:** A minimalist design promotes better accessibility with a clearer visual hierarchy.

## 1. Color Palette

We'll use a primarily neutral color palette with a single accent color for interactive elements. This ensures good contrast and readability.

*   **Primary:**
    *   Light Mode: `#FFFFFF` (White)
    *   Dark Mode: `#1F2937` (Slate 800)
*   **Secondary:**
    *   Light Mode: `#F9FAFB` (Gray 50) - Used for backgrounds, cards, etc.
    *   Dark Mode: `#374151` (Gray 700) - Used for backgrounds, cards, etc.
*   **Text:**
    *   Light Mode: `#111827` (Gray 900) - Primary text color
    *   Dark Mode: `#F3F4F6` (Gray 100) - Primary text color
    *   Light Mode: `#4B5563` (Gray 600) - Secondary text (labels, less important info)
    *   Dark Mode:  `#D1D5DB` (Gray 300) - Secondary text
*   **Accent (Blue):**
    *   Light Mode: `#3B82F6` (Blue 500) - Used for buttons, links, and interactive elements.
    *   Dark Mode: `#60A5FA` (Blue 400) - Used for buttons, links, and interactive elements.
*   **Neumorphic Shadow (Light Mode):**
    *   Light Shadow: `rgba(255, 255, 255, 0.7)` -  Inset top-left shadow
    *   Dark Shadow: `rgba(148, 163, 184, 0.3)` - Inset bottom-right shadow
*  **Neumorphic Shadow (Dark Mode):**
    *   Light Shadow: `rgba(55, 65, 81, 0.7)` - Inset top-left shadow.
    *   Dark Shadow: `rgba(0, 0, 0, 0.4)` - Inset bottom-right shadow.
* **Error**
    *   Light mode: `#EF4444` (Red 500)
    *   Dark mode: `#F87171` (Red 400)
* **Success:**
    *   Light mode: `#10B981` (Green 500)
    *    Dark mode:  `#34D399` (Emerald 400)

## 2. Typography

We'll use a single sans-serif font family for simplicity and readability. Inter is a good choice for its versatility and accessibility.

*   **Font Family:** Inter (from Google Fonts)
*   **Headings:**
    *   H1: Inter, Bold, 36px (Light Mode: Gray 900, Dark Mode: Gray 100)
    *   H2: Inter, Bold, 24px (Light Mode: Gray 900, Dark Mode: Gray 100)
    *   H3: Inter, SemiBold, 18px (Light Mode: Gray 900, Dark Mode: Gray 100)
*   **Body:**
    *   Regular: Inter, Regular, 16px (Light Mode: Gray 900, Dark Mode: Gray 100)
    *   Secondary: Inter, Regular, 14px (Light Mode: Gray 600, Dark Mode: Gray 300)
* **Buttons:**
   * Inter, Medium, 16px, (Accent color)

## 3. UI Component Library

The following components will be redesigned with a minimalist + subtle Neumorphism approach. Note that these descriptions provide the *intent* - the actual implementation will be done in code.

*   **Button (Primary):**
    *   **Light Mode:**  White background (#FFFFFF), Blue text (#3B82F6), rounded corners (8px), subtle inset shadows (Neumorphic).
        *   Hover: Slightly darker blue text, increased shadow intensity.
        *    Active:  Slight scale transform (e.g., scale(0.95))
    *   **Dark Mode:** Dark Gray background (#374151), Light Blue text (#60A5FA), rounded corners (8px), subtle inset shadows (Neumorphic).
        *   Hover: Slightly lighter blue text.
        *    Active:  Slight scale transform (e.g., scale(0.95))
*   **Button (Secondary):**
    *   **Light Mode:** Light Gray background (#F9FAFB), Gray text (#4B5563), rounded corners (8px).
        * Hover: Slightly darker gray background.
    *   **Dark Mode:**  Dark Gray background (#374151), Lighter Gray text (#D1D5DB), rounded corners (8px).
        *  Hover: Slightly lighter gray background.
*   **Input Field:**
    *   **Light Mode:** White background (#FFFFFF), Gray border, rounded corners (8px), subtle inset shadow (Neumorphic). Placeholder text in Gray 600.
    *   **Dark Mode:** Dark Gray background (#374151), Lighter Gray border, rounded corners (8px), subtle inset shadow (Neumorphic). Placeholder text in Gray 300.
    * Focus: Blue outline/ring.
*   **Card:**
    *   **Light Mode:** Light Gray background (#F9FAFB), subtle outer shadow (for depth), rounded corners (8px).
    *   **Dark Mode:** Dark Gray background (#374151), subtle inset shadow (Neumorphic), rounded corners (8px).
*   **Table:**
    *   Minimalist design with clear separation between rows (e.g., alternating row colors or subtle borders).
    *   Header row with slightly bolder text.
    *   Use of sufficient padding and spacing for readability.
* **Navbar**
  * **Light Mode:** White background (#FFFFFF)
  * **Dark Mode:**  Dark Gray background (#1F2937)
  * Use selected color palette and typography.
* **Modals**
    * **Light mode:** White background
    * **Dark Mode:**  Dark Gray background (#374151)
    * Center content, rounded corners.
    * Clear close button (X icon).

## 4. Iconography
* Heroicons (Consistent with current use).

## 5. Key Screens (Examples)

The following screens will be wireframed and mocked up:

1.  **Homepage:** Redesign the hero section, feature cards, and "How It Works" section to align with the new style.
2.  **Upload Page:** Simplify the upload process, potentially using a larger dropzone area and clearer visual cues.
3.  **Database Page:** Improve the table layout, add filtering/sorting options, and enhance the overall visual clarity.