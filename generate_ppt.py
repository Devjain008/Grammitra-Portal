import os
import sys

# Auto-install python-pptx if it is not installed
try:
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
    from pptx.enum.shapes import MSO_SHAPE
except ImportError:
    print("Installing required python-pptx package...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-pptx"])
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
    from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    
    # Set slide dimensions to widescreen 16:9
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    
    # Theme Colors matching BuildVerse Template exactly
    c_purple = RGBColor(114, 83, 192)      # Vibrant theme purple
    c_magenta = RGBColor(224, 64, 251)     # Bright magenta accent
    c_dark = RGBColor(33, 33, 33)          # Dark text
    c_light_gray = RGBColor(248, 248, 250) # Light card background
    c_white = RGBColor(255, 255, 255)
    c_mint = RGBColor(46, 125, 50)         # GramMitra Emerald

    blank_layout = prs.slide_layouts[6]
    
    # ----------------------------------------------------
    # Helper: Add Header (Loads full-bleed template background image)
    # ----------------------------------------------------
    def add_header(slide, title_text):
        # Add template background image as the absolute first shape
        slide.shapes.add_picture("buildverse_background.png", Inches(0), Inches(0), Inches(13.33), Inches(7.5))
        
        # Slide Title Centered perfectly between the top-left and top-right logos
        title_box = slide.shapes.add_textbox(Inches(2.5), Inches(0.3), Inches(8.33), Inches(0.6))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text.upper() # Keep it in uppercase like the template
        p_t.font.size = Pt(26)
        p_t.font.bold = True
        p_t.font.color.rgb = c_purple
        p_t.font.name = "Arial"
        p_t.alignment = PP_ALIGN.CENTER

    # ----------------------------------------------------
    # Helper: Add Footer (Covers hardcoded slide number 8 and draws correct slide num)
    # ----------------------------------------------------
    def add_footer(slide, slide_num):
        # Cover the hardcoded slide number '8' baked in the background image
        cover_shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(12.1), Inches(6.92), Inches(0.9), Inches(0.55)
        )
        cover_shape.fill.solid()
        cover_shape.fill.fore_color.rgb = c_purple
        cover_shape.line.fill.background()
        
        # Correct slide number text positioned on the purple footer
        numBox = slide.shapes.add_textbox(Inches(11.5), Inches(6.95), Inches(1.5), Inches(0.5))
        p_num = numBox.text_frame.paragraphs[0]
        p_num.text = str(slide_num)
        p_num.font.size = Pt(11)
        p_num.font.bold = True
        p_num.font.color.rgb = c_white
        p_num.font.name = "Arial"
        p_num.alignment = PP_ALIGN.RIGHT

    # ====================================================
    # SLIDE 1: Title & Team Details (Slide 1 of 8)
    # ====================================================
    slide1 = prs.slides.add_slide(blank_layout)
    
    # Add background image to Slide 1
    slide1.shapes.add_picture("buildverse_background.png", Inches(0), Inches(0), Inches(13.33), Inches(7.5))

    # Widescreen Project Title Header
    title_box = slide1.shapes.add_textbox(Inches(0.5), Inches(2.2), Inches(6.2), Inches(2.5))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    p_t = tf_title.paragraphs[0]
    p_t.text = "GramMitra AI"
    p_t.font.size = Pt(54)
    p_t.font.bold = True
    p_t.font.color.rgb = c_purple
    
    p_sub = tf_title.add_paragraph()
    p_sub.text = "Voice-Enabled Rural Upliftment & Localized Development Ecosystem"
    p_sub.font.size = Pt(16)
    p_sub.font.italic = True
    p_sub.font.color.rgb = c_dark
    p_sub.space_before = Pt(10)

    # Team details card on the right (overlay card)
    card = slide1.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.0), Inches(1.4), Inches(5.8), Inches(4.8)
    )
    card.fill.solid()
    card.fill.fore_color.rgb = c_white
    card.line.color.rgb = c_purple
    card.line.width = Pt(2.5)
    
    tf_card = card.text_frame
    tf_card.word_wrap = True
    tf_card.margin_left = Inches(0.4)
    tf_card.margin_top = Inches(0.4)
    
    p_c1 = tf_card.paragraphs[0]
    p_c1.text = "TEAM DETAILS :"
    p_c1.font.size = Pt(22)
    p_c1.font.bold = True
    p_c1.font.color.rgb = c_purple
    p_c1.space_after = Pt(20)
    
    fields = [
        ("Team Name", "Innovators / GramMitra Creators"),
        ("Theme", "Deep Tech for Rural & Social Impact"),
        ("Tracks", "Web/App Development, AI/ML, Accessibility"),
        ("Project Name", "GramMitra AI"),
        ("Team Leader", "Team Leader Name (Edit here)"),
        ("College Name", "LNCT Group of Colleges, Bhopal")
    ]
    
    for label, val in fields:
        p = tf_card.add_paragraph()
        p.text = f"•  {label} - "
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = c_purple
        
        # Add value in normal weight
        run = p.add_run()
        run.text = val
        run.font.bold = False
        run.font.color.rgb = c_dark
        p.space_after = Pt(12)

    add_footer(slide1, 1)

    # ====================================================
    # SLIDE 2: PROBLEM STATEMENT & NEED (Slide 2 of 8)
    # ====================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "PROBLEM STATEMENT & NEED")
    
    # Left column - Description
    left_box = slide2.shapes.add_textbox(Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.5))
    tf_left = left_box.text_frame
    tf_left.word_wrap = True
    
    p = tf_left.paragraphs[0]
    p.text = "Rural Digital Exclusion & Literacy Gaps"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = c_purple
    p.space_after = Pt(15)
    
    bullets = [
        ("Dialect & Literacy Barriers", "More than 70% of the rural Indian population communicates exclusively in local regional languages. Standard MERN portals require typing in English, making them highly intimidating and unusable."),
        ("Information Disconnection", "Essential services (crop diagnostics, soil analysis, transport networks, hospital directories, local handymen, government schemes) are split across dozens of heavy, non-mobile friendly web links."),
        ("Economic Exploitation", "Micro-merchants and farmers lack a simple localized marketplace (Mandi) to list their stock, subjecting them to high commissions and pricing pressure by middlemen.")
    ]
    
    for head, text in bullets:
        p_h = tf_left.add_paragraph()
        p_h.text = f"❌ {head} :"
        p_h.font.size = Pt(14)
        p_h.font.bold = True
        p_h.font.color.rgb = c_magenta
        p_h.space_before = Pt(10)
        
        p_t = tf_left.add_paragraph()
        p_t.text = text
        p_t.font.size = Pt(12)
        p_t.font.color.rgb = c_dark
        p_t.space_after = Pt(10)
        p_t.space_before = Pt(2)

    # Right column - Need Card
    right_card = slide2.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.5), Inches(1.9), Inches(5.0), Inches(4.4)
    )
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = c_light_gray
    right_card.line.color.rgb = c_purple
    right_card.line.width = Pt(1.5)
    
    tf_rc = right_card.text_frame
    tf_rc.word_wrap = True
    tf_rc.margin_left = Inches(0.4)
    tf_rc.margin_top = Inches(0.4)
    
    p = tf_rc.paragraphs[0]
    p.text = "THE URGENT NEED"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = c_purple
    p.space_after = Pt(20)
    
    points = [
        "A highly inclusive voice assistant that understands spoken dialects (Hindi & English), supporting illiterate and senior citizens.",
        "A unified directory mapping nearest hospitals, schools, and handymen (electricians, mechanics, drivers) directly to their village profile.",
        "A zero-commission mobile marketplace where local buyers and sellers connect instantly, keeping revenues inside the village ecosystem."
    ]
    
    for pt in points:
        p_p = tf_rc.add_paragraph()
        p_p.text = "✔  " + pt
        p_p.font.size = Pt(12)
        p_p.font.color.rgb = c_dark
        p_p.space_before = Pt(12)
        p_p.space_after = Pt(10)

    add_footer(slide2, 2)

    # ====================================================
    # SLIDE 3: PROPOSED SOLUTION & INNOVATION (Slide 3 of 8)
    # ====================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "PROPOSED SOLUTION & INNOVATION")
    
    # Core Solution Intro
    intro_box = slide3.shapes.add_textbox(Inches(0.75), Inches(1.7), Inches(11.83), Inches(0.8))
    tf_intro = intro_box.text_frame
    tf_intro.word_wrap = True
    p = tf_intro.paragraphs[0]
    p.text = "GramMitra AI: A Single Conversational Access Point"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = c_purple
    
    p_sub = tf_intro.add_paragraph()
    p_sub.text = "Consolidating agriculture, retail, directories, and labor services into one beautiful web application."
    p_sub.font.size = Pt(13)
    p_sub.font.italic = True
    p_sub.font.color.rgb = c_magenta

    # 3 Solution pillars
    pillars = [
        ("Conversational Voice Assistant", "Our primary innovation. Leverages standard HTML5 browser-native Web Speech API (STT & TTS) alongside Google Gemini 2.5 Flash to provide high-quality bilingual (Hindi/English) voice replies. Zero API transcription runtime cost! Displays dynamic local cards instantly based on queries.", Inches(0.75)),
        ("Direct Mandi & Labor Registry", "A commission-free local marketplace. Farmers and shopkeepers can open virtual shops and list produce directly to buyers. A localized skilled labor registry lets villagers easily hire local handymen (electricians, mechanics, plumbers) and view work listings.", Inches(4.75)),
        ("Dynamic Amenities Locator", "Integrates full village infrastructure profiles. Automatically returns localized services (distance to nearest hospitals, school medium, and local school directories) via conversational query analysis.", Inches(8.75))
    ]
    
    for title, desc, left_pos in pillars:
        box = slide3.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(2.6), Inches(3.8), Inches(4.0)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = c_light_gray
        box.line.color.rgb = c_purple
        box.line.width = Pt(1.5)
        
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.3)
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = c_purple
        p.space_after = Pt(15)
        p.alignment = PP_ALIGN.CENTER
        
        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = c_dark
        p_d.space_before = Pt(5)
        p_d.space_after = Pt(5)

    add_footer(slide3, 3)

    # ====================================================
    # SLIDE 4: TECHNICAL ARCHITECTURE (Slide 4 of 8)
    # ====================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "TECHNICAL ARCHITECTURE")
    
    # Intro
    intro_box = slide4.shapes.add_textbox(Inches(0.75), Inches(1.6), Inches(11.83), Inches(0.5))
    p = intro_box.text_frame.paragraphs[0]
    p.text = "Robust, Secure & Multi-Tier MERN Stack"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = c_purple

    # 4 horizontal layers representing the stack
    layers = [
        ("Presentation Layer (Vite & React)", "Frontend interface rendering visual states with Framer Motion. Uses a root-level Portal for the Voice Assistant to ensure floating alignment. Combines HTML5 Web Speech APIs.", Inches(2.2)),
        ("Application Core (Node.js & Express)", "Bridges communication requests. Directs requests locally to MongoDB for known directories (e.g. hospitals, schools) and routes general vernacular advice requests to Gemini.", Inches(3.3)),
        ("AI Core (Gemini 2.5 Flash)", "Google Gemini 2.5 Flash API. Secured server-side via Node environment configurations. Processes raw transcripts in Hindi and English, producing dynamic responsive outputs.", Inches(4.4)),
        ("Persistence Layer (MongoDB Atlas)", "Standard Mongoose schemas for village profiles, hospitals/schools directory lists, mandi trade product cards, job boards, and cataloged government schemes.", Inches(5.5))
    ]
    
    for title, desc, top_pos in layers:
        # Layer Header Box
        header_shape = slide4.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0.75), top_pos, Inches(3.5), Inches(0.9)
        )
        header_shape.fill.solid()
        header_shape.fill.fore_color.rgb = c_purple
        header_shape.line.fill.background()
        
        tf_h = header_shape.text_frame
        tf_h.word_wrap = True
        tf_h.margin_top = Inches(0.15)
        p_h = tf_h.paragraphs[0]
        p_h.text = title
        p_h.font.size = Pt(12)
        p_h.font.bold = True
        p_h.font.color.rgb = c_white
        p_h.alignment = PP_ALIGN.CENTER
        
        # Layer Detail Box
        desc_shape = slide4.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(4.35), top_pos, Inches(8.2), Inches(0.9)
        )
        desc_shape.fill.solid()
        desc_shape.fill.fore_color.rgb = c_light_gray
        desc_shape.line.color.rgb = c_purple
        desc_shape.line.width = Pt(1)
        
        tf_d = desc_shape.text_frame
        tf_d.word_wrap = True
        tf_d.margin_left = Inches(0.2)
        tf_d.margin_top = Inches(0.1)
        p_d = tf_d.paragraphs[0]
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = c_dark

    add_footer(slide4, 4)

    # ====================================================
    # SLIDE 5: PROCESS FLOW DIAGRAM (Slide 5 of 8)
    # ====================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "PROCESS FLOW DIAGRAM")
    
    # Process steps representation
    intro_box = slide5.shapes.add_textbox(Inches(0.75), Inches(1.6), Inches(11.83), Inches(0.5))
    p = intro_box.text_frame.paragraphs[0]
    p.text = "Voice Assistant Processing & Routing Pipeline"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = c_purple
    
    steps = [
        ("1. Mic Input", "Villager taps the mic in the top navbar and speaks in their native tongue (Hindi or English)."),
        ("2. Transcribe", "Browser's Web Speech API instantly transcribes audio input to raw text offline on device."),
        ("3. Query Parser", "Express backend parses text to identify key intent (e.g. 'hospital', 'farmer', 'mandi')."),
        ("4. Local Lookup", "If intent is directory-bound, queries localized MongoDB village directories directly."),
        ("5. General Query", "If intent is general advice, sends prompts through Gemini 2.5 Flash secure backend API."),
        ("6. Synthesize (TTS)", "Card output renders on the screen, while Speech Synthesis speaks the answer out loud.")
    ]
    
    col_width = Inches(3.6)
    col_height = Inches(2.1)
    
    for i, (title, desc) in enumerate(steps):
        row = i // 3
        col = i % 3
        
        left = Inches(0.75) + col * Inches(4.0)
        top = Inches(2.3) + row * Inches(2.3)
        
        # Step shape box
        box = slide5.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, col_width, col_height
        )
        box.fill.solid()
        box.fill.fore_color.rgb = c_light_gray
        box.line.color.rgb = c_magenta
        box.line.width = Pt(1.5)
        
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_top = Inches(0.2)
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = c_purple
        p.space_after = Pt(10)
        
        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = c_dark
        p_d.space_before = Pt(2)

    add_footer(slide5, 5)

    # ====================================================
    # SLIDE 6: IMPLEMENTATION METHODOLOGY & FEASIBILITY (Slide 6 of 8)
    # ====================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6, "IMPLEMENTATION METHODOLOGY & FEASIBILITY")
    
    # Left column: Agile Roadmap
    left_box = slide6.shapes.add_textbox(Inches(0.75), Inches(1.7), Inches(6.0), Inches(4.8))
    tf_left = left_box.text_frame
    tf_left.word_wrap = True
    
    p = tf_left.paragraphs[0]
    p.text = "Implementation Roadmap (10-Week Deployment)"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = c_purple
    p.space_after = Pt(15)
    
    phases = [
        ("Phase 1 - Research & Local Database Seeding (W1-2)", "Establish normalized schemas and seed localized infrastructure directories (district schools, healthcare networks, village workers)."),
        ("Phase 2 - Core MERN Platform Development (W3-5)", "Design and construct primary modules including Mandi marketplace, labor directories, and government schemes catalog."),
        ("Phase 3 - Vernacular Voice & AI Integration (W6-8)", "Implement Web Speech STT/TTS modules and secure server-side Gemini 2.5 Flash coordinators with fallback filters."),
        ("Phase 4 - Field Testing & Public Deployment (W9-10)", "Test directly with village focus groups, optimize speech parameters, and launch the platform publicly.")
    ]
    
    for head, text in phases:
        p_h = tf_left.add_paragraph()
        p_h.text = f"📍 {head} :"
        p_h.font.size = Pt(12)
        p_h.font.bold = True
        p_h.font.color.rgb = c_purple
        p_h.space_before = Pt(8)
        
        p_t = tf_left.add_paragraph()
        p_t.text = text
        p_t.font.size = Pt(10.5)
        p_t.font.color.rgb = c_dark
        p_t.space_before = Pt(2)
        p_t.space_after = Pt(8)

    # Right column: Feasibility Panel
    right_card = slide6.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.5), Inches(1.8), Inches(5.0), Inches(4.7)
    )
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = c_light_gray
    right_card.line.color.rgb = c_magenta
    right_card.line.width = Pt(1.5)
    
    tf_rc = right_card.text_frame
    tf_rc.word_wrap = True
    tf_rc.margin_left = Inches(0.3)
    tf_rc.margin_top = Inches(0.3)
    
    p = tf_rc.paragraphs[0]
    p.text = "FEASIBILITY ANALYSIS"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = c_purple
    p.space_after = Pt(15)
    
    feas = [
        ("Technical Feasibility", "HTML5 Speech API holds universal, offline-capable support on Chrome/Edge browsers (desktop and mobile), minimizing server load and latency."),
        ("Economic Feasibility", "By routing simple commands locally and relying on Gemini's highly optimized, free-tier services, operational and API transcription costs are close to zero."),
        ("Social Feasibility", "Designed specifically for accessibility: spoken outputs in Hindi/English remove literacy barriers, making digital tools practical for all villagers.")
    ]
    
    for head, text in feas:
        p_h = tf_rc.add_paragraph()
        p_h.text = f"🚀 {head} :"
        p_h.font.size = Pt(12)
        p_h.font.bold = True
        p_h.font.color.rgb = c_purple
        p_h.space_before = Pt(8)
        
        p_t = tf_rc.add_paragraph()
        p_t.text = text
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = c_dark
        p_t.space_before = Pt(2)
        p_t.space_after = Pt(6)

    add_footer(slide6, 6)

    # ====================================================
    # SLIDE 7: PROTOTYPE OVERVIEW (Slide 7 of 8)
    # ====================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_header(slide7, "WORKING PROTOTYPE OVERVIEW")
    
    intro_box = slide7.shapes.add_textbox(Inches(0.75), Inches(1.6), Inches(11.83), Inches(0.5))
    p = intro_box.text_frame.paragraphs[0]
    p.text = "Widescreen Showcase of Core Prototype Features"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = c_purple
    
    # 4 cards showing off the sub-features of the prototype
    features = [
        ("Bilingual Voice Assistant", "Sliding glassmorphic drawer rendered securely via portal. Features real-time voice inputs, visual audio wave pulses, mute controls, history clearing, and dynamic, collapsible suggestion chips containing quick prompts based on the current page route with a down arrow for hiding."),
        ("Farmer AI Advisor", "Custom farming diagnostics page combining local daily weather forecasts, crop advisory metrics, and dynamic soil recommendation calculations in simple cards."),
        ("Mandi Trade Marketplace", "A fully functional marketplace allowing farmers to list crop stock, set direct trade prices, upload item descriptions, and chat without commission cuts."),
        ("Amenities & Local Directories", "Full map directories of Government and Private schools (and instruction mediums), healthcare hospitals (and bed counts), and village skilled handymen.")
    ]
    
    col_width = Inches(5.6)
    col_height = Inches(2.2)
    
    for i, (title, desc) in enumerate(features):
        row = i // 2
        col = i % 2
        
        left = Inches(0.75) + col * Inches(6.2)
        top = Inches(2.3) + row * Inches(2.4)
        
        # Step shape box
        box = slide7.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, col_width, col_height
        )
        box.fill.solid()
        box.fill.fore_color.rgb = c_light_gray
        box.line.color.rgb = c_purple
        box.line.width = Pt(1.5)
        
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_top = Inches(0.2)
        
        p = tf.paragraphs[0]
        p.text = "📱  " + title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = c_purple
        p.space_after = Pt(10)
        
        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = c_dark
        p_d.space_before = Pt(2)

    add_footer(slide7, 7)

    # ====================================================
    # SLIDE 8: SOCIAL IMPACT & TARGET AUDIENCE (Slide 8 of 8)
    # ====================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_header(slide8, "SOCIAL IMPACT & TARGET AUDIENCE")
    
    intro_box = slide8.shapes.add_textbox(Inches(0.75), Inches(1.6), Inches(11.83), Inches(0.5))
    p = intro_box.text_frame.paragraphs[0]
    p.text = "Direct Upliftment & Multi-Dimensional Empowerment"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = c_purple
    
    # Split into 3 columns
    impact_pillars = [
        ("Financial Empowerment", "Eliminates mandi middleman pricing exploitation. Farmers and rural micro-businesses keep 100% of their trade revenues. Directly links skilled handymen to localized employment vacancies.", Inches(0.75)),
        ("Inclusivity & Accessibility", "Democratizes artificial intelligence for non-literate, elderly, and visually impaired villagers. Standardizes native voice control in Hindi, bringing AI to the grassroots level.", Inches(4.75)),
        ("Informed Rural Healthcare", "Ensures immediate, localized, and actionable healthcare info, providing rapid symptom diagnostics and mapping distances to nearest hospital bed facilities in emergencies.", Inches(8.75))
    ]
    
    for title, desc, left_pos in impact_pillars:
        box = slide8.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(2.3), Inches(3.8), Inches(4.3)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = c_light_gray
        box.line.color.rgb = c_purple
        box.line.width = Pt(1.5)
        
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.3)
        
        p = tf.paragraphs[0]
        p.text = "🌟  " + title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = c_purple
        p.space_after = Pt(15)
        p.alignment = PP_ALIGN.CENTER
        
        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = c_dark
        p_d.space_before = Pt(5)
        p_d.space_after = Pt(5)

    add_footer(slide8, 8)
    
    # Save the presentation with fallback in case of open file lock
    filename = "BuildVerse_Idea_Submission_GramMitra_AI.pptx"
    try:
        prs.save(filename)
        print(f"Presentation saved successfully as '{filename}'!")
    except PermissionError:
        alternative_name = "BuildVerse_Idea_Submission_GramMitra_AI_v2.pptx"
        try:
            prs.save(alternative_name)
            print(f"Saved successfully as '{alternative_name}' (locked by another app)!")
        except PermissionError:
            alternative_name_3 = "BuildVerse_Idea_Submission_GramMitra_AI_v3.pptx"
            prs.save(alternative_name_3)
            print(f"Saved successfully as '{alternative_name_3}'!")

if __name__ == "__main__":
    create_presentation()
