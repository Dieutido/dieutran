
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { ImageConfig, StoryAsset } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStoryAssets = async (story: string): Promise<StoryAsset[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Nhiệm vụ của bạn là phân tích một câu chuyện tiếng Việt và tạo ra một mảng JSON gồm chính xác 10 đối tượng để tạo một bộ phim chuyên nghiệp. Tính nhất quán của nhân vật là **QUAN TRỌNG NHẤT VÀ LÀ QUY TẮC BẤT BIẾN**.

**QUY TRÌNH BẮT BUỘC TUYỆT ĐỐI:**
1.  **Xác định Nhân vật chính:** Đọc kỹ câu chuyện và xác định nhân vật chính.
2.  **Tạo Mã định danh Nhân vật (Character ID):** Dựa trên mô tả trong truyện, hãy tạo một chuỗi mô tả cực kỳ chi tiết, nhất quán và không thể thay đổi cho nhân vật chính. Chuỗi này phải có định dạng sau: \`(Character ID: [mô tả chi tiết])\`. Ví dụ: \`(Character ID: Thomas, a man in his early 30s with messy dark brown hair, deep-set thoughtful brown eyes, a slightly athletic build, typically seen in a vintage leather jacket and jeans)\`.
3.  **Tạo 10 Phân cảnh:** Tạo một mảng JSON gồm 10 đối tượng. Mỗi đối tượng phải có 3 thuộc tính:
    *   \`"prompt"\`: Một lời nhắc tạo ảnh (prompt) bằng tiếng Anh. **QUY TẮC KHÔNG THỂ PHÁ VỠ:** Lời nhắc này **PHẢI** bắt đầu bằng cách sao chép y hệt, không thay đổi dù chỉ một ký tự, chuỗi **Character ID** bạn đã tạo ở bước 2. Sau đó mới đến mô tả hành động và bối cảnh. Ví dụ: \`(Character ID: Thomas, a man in his early 30s...) standing in a dusty attic, sunlight streaming through a single window.\`
    *   \`"vietnamesePart"\`: Đoạn văn tường thuật tiếng Việt tương ứng từ câu chuyện gốc.
    *   \`"englishPart"\`: Bản dịch tiếng Anh của \`"vietnamesePart"\`.

Hãy đảm bảo chuỗi **Character ID** giống hệt nhau trong cả 10 lời nhắc. Bất kỳ sự sai lệch nào cũng sẽ làm hỏng kết quả.

**Câu chuyện:** "${story}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              prompt: {
                type: Type.STRING,
                description: "A detailed image generation prompt in English that MUST start with the consistent Character ID.",
              },
              vietnamesePart: {
                type: Type.STRING,
                description: "The corresponding narrative segment from the original Vietnamese story.",
              },
              englishPart: {
                type: Type.STRING,
                description: "The English translation of the Vietnamese narrative segment.",
              },
            },
            required: ["prompt", "vietnamesePart", "englishPart"],
          },
        },
      },
    });

    const assets = JSON.parse(response.text);
    if (Array.isArray(assets) && assets.length > 0 && assets.every(a => a.prompt && a.vietnamesePart && a.englishPart)) {
      return assets;
    }
    throw new Error("Invalid asset format received from API.");
  } catch (error) {
    console.error("Error generating story assets:", error);
    throw new Error("Không thể tạo tài sản câu chuyện (lời nhắc và phụ đề). Vui lòng thử lại.");
  }
};

export const generateThumbnailPrompt = async (story: string, channelName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Phân tích câu chuyện sau đây và tạo một lời nhắc (prompt) bằng tiếng Anh duy nhất để tạo ảnh thumbnail cho video YouTube.
            
            **Yêu cầu cho lời nhắc:**
            1.  **Hấp dẫn và Gợi mở:** Phải tóm tắt được cảm xúc hoặc chủ đề cốt lõi của câu chuyện mà không tiết lộ quá nhiều.
            2.  **Tối ưu hóa cho Kênh:** Thumbnail này dành cho kênh YouTube tên là "${channelName}", chuyên về những câu chuyện kể cảm xúc và sâu sắc. Lời nhắc cần tạo ra một hình ảnh có thể thu hút khán giả của thể loại này.
            3.  **Tập trung vào Nhân vật:** Lời nhắc nên tập trung vào nhân vật chính trong một khoảnh khắc quan trọng hoặc biểu cảm.
            4.  **Chất lượng cao:** Yêu cầu hình ảnh có chất lượng điện ảnh (cinematic), ánh sáng ấn tượng và màu sắc sống động để nổi bật trên YouTube.
            
            **Câu chuyện:** "${story}"
            
            Chỉ trả về duy nhất một chuỗi lời nhắc (prompt) bằng tiếng Anh.`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating thumbnail prompt:", error);
        throw new Error("Không thể tạo lời nhắc cho thumbnail.");
    }
};


export const generateImagesFromPrompt = async (prompt: string, config: ImageConfig): Promise<string[]> => {
  try {
    const augmentedPrompt = `${prompt}. Generate the image with a ${config.aspectRatio} aspect ratio.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: augmentedPrompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const images: string[] = [];
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          images.push(part.inlineData.data);
        }
      }
    }

    if (images.length === 0) {
      if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
        throw new Error(`API call finished with reason: ${response.candidates[0].finishReason}. The prompt may have been blocked.`);
      }
      throw new Error("API did not return any image data.");
    }
    
    return images;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error(`Error generating images for prompt "${prompt}":`, errorMessage);
    throw new Error(`Không thể tạo hình ảnh cho lời nhắc: "${prompt}". Lỗi API: ${errorMessage}`);
  }
};
