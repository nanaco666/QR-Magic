
export const generateSocialCaption = async (context: string): Promise<string> => {
  // Feature disabled for static deployment
  console.log("Caption generation requested for:", context);
  return "Check out this QR code! #Cool #Tech";
};
