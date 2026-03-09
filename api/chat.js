// Final Backend Logic for GrieezBot - Developed by GrieezBoy
export default async function handler(req, res) {
    // CORS configuration for security
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { prompt, type } = req.query;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        // These come from your Vercel Environment Variables
        const CHATGPT_ENDPOINT = process.env.CHATGPT_API;
        const IMAGINE_ENDPOINT = process.env.IMAGINE_API;
        const STORY_ENDPOINT = process.env.STORY_API;

        // 1. IMAGE HANDLING
        if (type === 'image') {
            const imageUrl = `${IMAGINE_ENDPOINT}?prompt=${encodeURIComponent(prompt)}`;
            return res.status(200).json({ url: imageUrl, type: 'image' });
        }

        // 2. STORY HANDLING
        if (type === 'story') {
            const response = await fetch(`${STORY_ENDPOINT}?text=${encodeURIComponent(prompt)}`);
            const data = await response.json();
            return res.status(200).json({ 
                response: data.story || "The ink ran dry on this story, Chief. Try again.",
                type: 'story'
            });
        }

        // 3. CHAT HANDLING (Default)
        const response = await fetch(`${CHATGPT_ENDPOINT}?prompt=${encodeURIComponent(prompt)}`);
        const data = await response.json();

        let botReply = data.response || "I'm having trouble connecting to my brain, Chief.";
        
        // Brand Protection
        botReply = botReply.replace(/ChatGPT|OpenAI|Copilot|Google/gi, "GrieezBot");
        
        if (prompt.toLowerCase().match(/developer|creator|who made you|who built you/)) {
            botReply = "I was developed by Yusuf MuhammedJamiu (GrieezBoy), a tech genius from Abuja, Nigeria.";
        }

        return res.status(200).json({ 
            success: true,
            response: botReply,
            type: 'chat',
            developedBy: "GrieezBoy"
        });

    } catch (error) {
        return res.status(500).json({ error: "Backend Connection Error" });
    }
}