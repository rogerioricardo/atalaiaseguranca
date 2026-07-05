const fs = require('fs');
let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

const target = `  const handleMaintenanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploadingMaintenance(true);
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewMaintenancePhoto(reader.result as string);
              setIsUploadingMaintenance(false);
          };
          reader.readAsDataURL(file);
      }
  };`;

const insert = `  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 800;
                  const MAX_HEIGHT = 800;
                  let width = img.width;
                  let height = img.height;

                  if (width > height) {
                      if (width > MAX_WIDTH) {
                          height *= MAX_WIDTH / width;
                          width = MAX_WIDTH;
                      }
                  } else {
                      if (height > MAX_HEIGHT) {
                          width *= MAX_HEIGHT / height;
                          height = MAX_HEIGHT;
                      }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
      });
  };

  const handleMaintenanceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploadingMaintenance(true);
          try {
              const compressedBase64 = await compressImage(file);
              setNewMaintenancePhoto(compressedBase64);
          } catch (err) {
              console.error("Erro ao comprimir imagem:", err);
              alert("Erro ao processar a imagem. Tente uma imagem menor.");
          } finally {
              setIsUploadingMaintenance(false);
          }
      }
  };`;

content = content.replace(target, insert);

const target2 = `  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewCameraPhoto(reader.result as string);
              setIsUploading(false);
          };
          reader.readAsDataURL(file);
      }
  };`;

const insert2 = `  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          try {
              const compressedBase64 = await compressImage(file);
              setNewCameraPhoto(compressedBase64);
          } catch (err) {
              console.error("Erro ao comprimir imagem:", err);
              alert("Erro ao processar a imagem. Tente uma imagem menor.");
          } finally {
              setIsUploading(false);
          }
      }
  };`;

content = content.replace(target2, insert2);

fs.writeFileSync('src/pages/Cameras.tsx', content);
