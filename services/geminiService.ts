
export const generateSocialCaption = async (context: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.text || "Check out this QR code!";
  } catch (error) {
    console.error("Caption Generation Error:", error);
    return "Could not generate caption at this time (Check API Configuration).";
  }
};
