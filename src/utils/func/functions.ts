export const getFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
};

// Create Base64 file
export const getBase64 = async (fileBase: File | null) => {
  if (!fileBase) return null;
  // func for creating
  const getBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  // file
  const base = await getBase64(fileBase);
  return base;
};

export const uuid = (): string => {
  const hexValues = '0123456789abcdef';
  let uuid = '';

  for (let i = 0; i < 36; i++) {
    const randomNumber = Math.random() * 16;
    const digit = hexValues.charAt(
      i === 14 ? 4 : i === 19 ? (randomNumber & 3) | 8 : randomNumber
    );
    uuid += i === 8 || i === 13 || i === 18 || i === 23 ? '-' : '';
    uuid += digit;
  }

  return uuid;
};

export const updateMetaTag = (name: string, content: string | number) => {
  document
    .querySelector(`meta[name=${name}]`)
    ?.setAttribute('content', content.toString());
};

export const imageUrlToFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob(); // Get the image as a blob
    const fileType = blob.type; // Get the MIME type of the file
    const file = new File([blob], filename, { type: fileType });
    return file;
  } catch {
    return null;
  }
};
