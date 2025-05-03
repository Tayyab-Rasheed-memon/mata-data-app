import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Retry function with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = 5,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < retries - 1) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`Rate limit hit, retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
};

export async function POST(request: Request) {
  try {
    // Validate environment variable
    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not set in environment variables');
      return NextResponse.json({ error: 'Server configuration error: API key missing' }, { status: 500 });
    }

    const { image, prompt } = await request.json();

    if (!image || !prompt) {
      console.error('Missing image or prompt in request body:', { image: !!image, prompt: !!prompt });
      return NextResponse.json({ error: 'Missing image or prompt in request' }, { status: 400 });
    }

    console.log('Sending request to Gemini API...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const response = await retryWithBackoff(() =>
      model.generateContent([
        {
          inlineData: {
            data: image,
            mimeType: 'image/jpeg',
          },
        },
        { text: prompt },
      ])
    );

    console.log('Received response from Gemini API:', response);

    const generatedText = response.response.text();
    let title = 'Default Title';
    let keywords: string[] = ['default', 'keyword'];

    if (generatedText) {
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
        const jsonStr = generatedText.substring(jsonStart, jsonEnd + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          title = parsed.title || title;
          keywords = parsed.keywords || keywords;
        } catch (e) {
          console.error('JSON parsing error:', e, 'Generated text:', generatedText);
          return NextResponse.json({ error: 'Failed to parse Gemini response as JSON' }, { status: 500 });
        }
      } else {
        console.error('No valid JSON found in Gemini response:', generatedText);
        return NextResponse.json({ error: 'Invalid JSON format in Gemini response' }, { status: 500 });
      }
    } else {
      console.error('Gemini response content is empty');
      return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 });
    }

    return NextResponse.json({ title, keywords });
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.error('Error generating metadata:', {
      message: errorMessage,
      status: error.status,
      details: error,
    });
    return NextResponse.json({ error: `Failed to generate metadata: ${errorMessage}` }, { status: 500 });
  }
}








// //                   f4rfg2



// import { NextResponse } from 'next/server';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// // Initialize Google Gemini client
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// // Retry function for handling rate limits
// const retryWithBackoff = async <T>(
//   fn: () => Promise<T>,
//   retries: number = 3,
//   delay: number = 1000
// ): Promise<T> => {
//   for (let i = 0; i < retries; i++) {
//     try {
//       return await fn();
//     } catch (error: any) {
//       if (error.status === 429 && i < retries - 1) {
//         const waitTime = delay * Math.pow(2, i);
//         console.log(`Rate limit hit, retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
//         await new Promise((resolve) => setTimeout(resolve, waitTime));
//         continue;
//       }
//       throw error;
//     }
//   }
//   throw new Error('Max retries reached');
// };

// export async function POST(request: Request) {
//   try {
//     // Validate environment variable
//     if (!process.env.GOOGLE_API_KEY) {
//       console.error('GOOGLE_API_KEY is not set in environment variables');
//       return NextResponse.json({ error: 'Server configuration error: API key missing' }, { status: 500 });
//     }

//     const { image, prompt } = await request.json();

//     if (!image || !prompt) {
//       console.error('Missing image or prompt in request body:', { image: !!image, prompt: !!prompt });
//       return NextResponse.json({ error: 'Missing image or prompt in request' }, { status: 400 });
//     }

//     console.log('Sending request to Gemini API...');
//     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

//     const response = await retryWithBackoff(() =>
//       model.generateContent([
//         {
//           inlineData: {
//             data: image,
//             mimeType: 'image/jpeg',
//           },
//         },
//         { text: prompt },
//       ])
//     );

//     console.log('Received response from Gemini API:', response);

//     const generatedText = response.response.text();
//     let title = 'Default Title';
//     let keywords: string[] = ['default', 'keyword'];

//     if (generatedText) {
//       const jsonStart = generatedText.indexOf('{');
//       const jsonEnd = generatedText.lastIndexOf('}');
//       if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
//         const jsonStr = generatedText.substring(jsonStart, jsonEnd + 1);
//         try {
//           const parsed = JSON.parse(jsonStr);
//           title = parsed.title || title;
//           keywords = parsed.keywords || keywords;
//         } catch (e) {
//           console.error('JSON parsing error:', e, 'Generated text:', generatedText);
//           return NextResponse.json({ error: 'Failed to parse Gemini response as JSON' }, { status: 500 });
//         }
//       } else {
//         console.error('No valid JSON found in Gemini response:', generatedText);
//         return NextResponse.json({ error: 'Invalid JSON format in Gemini response' }, { status: 500 });
//       }
//     } else {
//       console.error('Gemini response content is empty');
//       return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 });
//     }

//     return NextResponse.json({ title, keywords });
//   } catch (error: any) {
//     const errorMessage = error.message || 'Unknown error';
//     console.error('Error generating metadata:', {
//       message: errorMessage,
//       status: error.status,
//       details: error,
//     });
//     return NextResponse.json({ error: `Failed to generate metadata: ${errorMessage}` }, { status: 500 });
//   }
// }






// // import { NextResponse } from 'next/server';
// // import OpenAI from 'openai';

// // // Initialize OpenAI client
// // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // export async function POST(request: Request) {
// //   try {
// //     // Validate environment variable
// //     if (!process.env.OPENAI_API_KEY) {
// //       console.error('OPENAI_API_KEY is not set in environment variables');
// //       return NextResponse.json({ error: 'Server configuration error: API key missing' }, { status: 500 });
// //     }

// //     const { image, prompt } = await request.json();

// //     if (!image || !prompt) {
// //       console.error('Missing image or prompt in request body:', { image: !!image, prompt: !!prompt });
// //       return NextResponse.json({ error: 'Missing image or prompt in request' }, { status: 400 });
// //     }

// //     console.log('Sending request to OpenAI API...');
// //     const response = await openai.chat.completions.create({
// //       model: 'gpt-4o',
// //       messages: [
// //         {
// //           role: 'user',
// //           content: [
// //             { type: 'text', text: prompt },
// //             { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
// //           ],
// //         },
// //       ],
// //     });

// //     console.log('Received response from OpenAI API:', response);

// //     const generatedText = response.choices[0].message.content;
// //     let title = 'Default Title';
// //     let keywords: string[] = ['default', 'keyword'];

// //     if (generatedText) {
// //       const jsonStart = generatedText.indexOf('{');
// //       const jsonEnd = generatedText.lastIndexOf('}');
// //       if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
// //         const jsonStr = generatedText.substring(jsonStart, jsonEnd + 1);
// //         try {
// //           const parsed = JSON.parse(jsonStr);
// //           title = parsed.title || title;
// //           keywords = parsed.keywords || keywords;
// //         } catch (e) {
// //           console.error('JSON parsing error:', e, 'Generated text:', generatedText);
// //           return NextResponse.json({ error: 'Failed to parse OpenAI response as JSON' }, { status: 500 });
// //         }
// //       } else {
// //         console.error('No valid JSON found in OpenAI response:', generatedText);
// //         return NextResponse.json({ error: 'Invalid JSON format in OpenAI response' }, { status: 500 });
// //       }
// //     } else {
// //       console.error('OpenAI response content is empty');
// //       return NextResponse.json({ error: 'Empty response from OpenAI' }, { status: 500 });
// //     }

// //     return NextResponse.json({ title, keywords });
// //   } catch (error: any) {
// //     const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
// //     console.error('Error generating metadata:', {
// //       message: errorMessage,
// //       status: error.response?.status,
// //       details: error.response?.data,
// //     });
// //     return NextResponse.json({ error: `Failed to generate metadata: ${errorMessage}` }, { status: 500 });
// //   }
// // }



// // // import { NextResponse } from 'next/server';
// // // import OpenAI from 'openai';

// // // // Initialize OpenAI client
// // // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // // export async function POST(request: Request) {
// // //   try {
// // //     const { image, prompt } = await request.json();

// // //     if (!image || !prompt) {
// // //       return NextResponse.json({ error: 'Missing image or prompt' }, { status: 400 });
// // //     }

// // //     const response = await openai.chat.completions.create({
// // //       model: 'gpt-4o', // Updated to gpt-4o
// // //       messages: [
// // //         {
// // //           role: 'user',
// // //           content: [
// // //             { type: 'text', text: prompt },
// // //             { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
// // //           ],
// // //         },
// // //       ],
// // //     });

// // //     const generatedText = response.choices[0].message.content;
// // //     let title = 'Default Title';
// // //     let keywords: string[] = ['default', 'keyword'];

// // //     if (generatedText) {
// // //       const jsonStart = generatedText.indexOf('{');
// // //       const jsonEnd = generatedText.lastIndexOf('}');
// // //       if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
// // //         const jsonStr = generatedText.substring(jsonStart, jsonEnd + 1);
// // //         try {
// // //           const parsed = JSON.parse(jsonStr);
// // //           title = parsed.title || title;
// // //           keywords = parsed.keywords || keywords;
// // //         } catch (e) {
// // //           console.error('JSON parsing error:', e);
// // //         }
// // //       }
// // //     }

// // //     return NextResponse.json({ title, keywords });
// // //   } catch (error: any) {
// // //     console.error('Error generating metadata:', error.response?.data || error.message);
// // //     return NextResponse.json({ error: 'Failed to generate metadata' }, { status: 500 });
// // //   }
// // // }