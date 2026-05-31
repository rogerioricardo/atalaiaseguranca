import { supabase, isRealSupabase } from '../lib/supabaseClient';

export interface FacialBiometric {
  id?: string;
  userId: string;
  descriptor: number[];
  photoBase64?: string;
  createdAt?: string;
}

// Memory fallback to support demo simulation mode
const SIMULATED_BIOMETRICS_KEY = 'atalaia_simulated_biometrics';

export const FacialBiometricService = {
  /**
   * Dynamically loads TensorFlow.js and BlazeFace from CDNs.
   * This delivers instant startup speed without bundle bloat.
   */
  loadTensorFlowAndBlazeFace: (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).tf && (window as any).blazeface) {
        console.log("[FacialBiometricService] TensorFlow and BlazeFace already initialized.");
        resolve((window as any).blazeface);
        return;
      }

      console.log("[FacialBiometricService] Dynamic loading TensorFlow.js from CDN...");
      
      const tfScript = document.createElement('script');
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js';
      tfScript.async = true;

      tfScript.onload = () => {
        console.log("[FacialBiometricService] TensorFlow.js loaded. Loading BlazeFace...");
        const bfScript = document.createElement('script');
        bfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js';
        bfScript.async = true;
        
        bfScript.onload = () => {
          console.log("[FacialBiometricService] BlazeFace loaded successfully.");
          resolve((window as any).blazeface);
        };
        
        bfScript.onerror = () => {
          reject(new Error("Erro ao carregar o modelo BlazeFace do CDN. Verifique a conexão."));
        };
        
        document.body.appendChild(bfScript);
      };

      tfScript.onerror = () => {
        reject(new Error("Erro ao carregar o TensorFlow.js do CDN. Verifique a conexão."));
      };

      document.body.appendChild(tfScript);
    });
  },

  /**
   * Generates a unique 15-dimensional facial biometric descriptor from BlazeFace's 6 keypoints.
   * Uses scale-invariant normalized ratio algorithms.
   */
  calculateBiometricDescriptor: (landmarks: [number, number][]): number[] => {
    if (!landmarks || landmarks.length < 6) return [];

    // Use pupillary distance (distance between right eye and left eye) as normalizer
    const dx = landmarks[0][0] - landmarks[1][0];
    const dy = landmarks[0][1] - landmarks[1][1];
    const pupillaryDistance = Math.sqrt(dx * dx + dy * dy) || 1.0;

    const descriptor: number[] = [];
    
    // Calculate scale-invariant Euclidean distances of all 15 keypoint pairs
    for (let i = 0; i < landmarks.length; i++) {
      for (let j = i + 1; j < landmarks.length; j++) {
        const diffX = landmarks[i][0] - landmarks[j][0];
        const diffY = landmarks[i][1] - landmarks[j][1];
        const rawDist = Math.sqrt(diffX * diffX + diffY * diffY);
        // Normalize against dynamic pupillary distance to make it distance-independent
        descriptor.push(rawDist / pupillaryDistance);
      }
    }

    return descriptor;
  },

  /**
   * Persistently saves a user's facial biometric signature to Supabase or simulated LocalStorage
   */
  saveBiometrics: async (userId: string, descriptor: number[], photoBase64?: string): Promise<boolean> => {
    const serializedDescriptor = JSON.stringify(descriptor);

    if (!isRealSupabase) {
      console.log("[FacialBiometricService] Demo Mode: Saving biometrics to localStorage for user", userId);
      const simulated: Record<string, any> = JSON.parse(localStorage.getItem(SIMULATED_BIOMETRICS_KEY) || '{}');
      simulated[userId] = {
        userId,
        descriptor,
        photoBase64,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(SIMULATED_BIOMETRICS_KEY, JSON.stringify(simulated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('user_facial_biometrics')
        .upsert({
          user_id: userId,
          descriptor: serializedDescriptor,
          photo_base64: photoBase64 || null,
        }, { onConflict: 'user_id' });

      if (error) {
        console.error("[FacialBiometricService] Supabase upload error:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("[FacialBiometricService] Exception saving biometrics:", e);
      return false;
    }
  },

  /**
   * Retrieves registered facial biometric data for a single user
   */
  getBiometricsForUser: async (userId: string): Promise<FacialBiometric | null> => {
    if (!isRealSupabase) {
      const simulated: Record<string, any> = JSON.parse(localStorage.getItem(SIMULATED_BIOMETRICS_KEY) || '{}');
      const found = simulated[userId];
      return found ? {
        userId: found.userId,
        descriptor: found.descriptor,
        photoBase64: found.photoBase64,
        createdAt: found.createdAt
      } : null;
    }

    try {
      const { data, error } = await supabase
        .from('user_facial_biometrics')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        descriptor: JSON.parse(data.descriptor),
        photoBase64: data.photo_base64 || undefined,
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  },

  /**
   * Deletes the registered facial biometrics for a single user
   */
  deleteBiometrics: async (userId: string): Promise<boolean> => {
    if (!isRealSupabase) {
      const simulated: Record<string, any> = JSON.parse(localStorage.getItem(SIMULATED_BIOMETRICS_KEY) || '{}');
      if (simulated[userId]) {
        delete simulated[userId];
        localStorage.setItem(SIMULATED_BIOMETRICS_KEY, JSON.stringify(simulated));
      }
      return true;
    }

    try {
      const { error } = await supabase
        .from('user_facial_biometrics')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error("[FacialBiometricService] Supabase delete error:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("[FacialBiometricService] Exception deleting biometrics:", e);
      return false;
    }
  },

  /**
   * Downloads all enrolled user biometrics combined with their profiles,
   * enabling local real-time identification comparisons.
   */
  getAllBiometrics: async (): Promise<{ userId: string; descriptor: number[]; email: string; name: string; photoBase64?: string }[]> => {
    if (!isRealSupabase) {
      const simulated: Record<string, any> = JSON.parse(localStorage.getItem(SIMULATED_BIOMETRICS_KEY) || '{}');
      // Read simulated sessions or demo profiles
      const list = [];
      const demoAccounts = [
         { id: 'demo-admin-id', email: 'admin@atalaia.com', name: 'Administrador Demo' },
         { id: 'demo-user-id', email: 'morador@atalaia.com', name: 'Morador Demo' }
      ];

      for (const entry of demoAccounts) {
        const biometrics = simulated[entry.id];
        if (biometrics) {
          list.push({
            userId: entry.id,
            descriptor: biometrics.descriptor,
            email: entry.email,
            name: entry.name,
            photoBase64: biometrics.photoBase64
          });
        }
      }
      return list;
    }

    try {
      // Join active biometric sets with user profiles
      const { data: bData, error: bError } = await supabase
        .from('user_facial_biometrics')
        .select('user_id, descriptor, photo_base64');

      if (bError || !bData) return [];

      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('id, email, name');

      if (pError || !pData) return [];

      const profilesMap = new Map(pData.map(p => [p.id, p]));

      return bData
        .map(b => {
          const profile = profilesMap.get(b.user_id);
          if (!profile) return null;
          return {
            userId: b.user_id,
            descriptor: JSON.parse(b.descriptor) as number[],
            email: profile.email,
            name: profile.name || profile.email.split('@')[0],
            photoBase64: b.photo_base64 || undefined
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    } catch (e) {
      console.error("[FacialBiometricService] Exception compiling biometric list:", e);
      return [];
    }
  },

  /**
   * Calculates the Euclidean distance (biometric variance index) between two sets of descriptor ratios.
   */
  compareDescriptors: (desc1: number[], desc2: number[]): number => {
    if (desc1.length !== desc2.length || desc1.length === 0) return Number.MAX_VALUE;
    
    let sumSquares = 0;
    for (let i = 0; i < desc1.length; i++) {
      const diff = desc1[i] - desc2[i];
      sumSquares += diff * diff;
    }
    
    return Math.sqrt(sumSquares);
  },

  /**
   * Searches for the closest matching face within the enrolled biometric sets,
   * returning the matched record if the confidence tolerance is met.
   */
  matchFace: (
    liveDescriptor: number[], 
    enrolledList: { userId: string; descriptor: number[]; email: string; name: string; photoBase64?: string }[]
  ): { userId: string; email: string; name: string; confidence: number; photoBase64?: string } | null => {
    if (!liveDescriptor || liveDescriptor.length === 0 || enrolledList.length === 0) return null;

    let bestMatch: typeof enrolledList[0] | null = null;
    let minDistance = Number.MAX_VALUE;

    // Evaluate variances for each registered user face
    for (const enrolled of enrolledList) {
      const distance = FacialBiometricService.compareDescriptors(liveDescriptor, enrolled.descriptor);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = enrolled;
      }
    }

    // Biometric facial match tolerance:
    // A smaller Euclidean coordinate distance implies a tighter match. 
    // Usually, < 0.16 is high confidence, < 0.22 is acceptable.
    const MATCH_THRESHOLD = 0.22;

    if (bestMatch && minDistance <= MATCH_THRESHOLD) {
      // Calculate a readable confidence score out of 100
      const confidence = Math.max(0, Math.min(100, Math.round((1 - (minDistance / MATCH_THRESHOLD)) * 100)));
      return {
        userId: bestMatch.userId,
        email: bestMatch.email,
        name: bestMatch.name,
        photoBase64: bestMatch.photoBase64,
        confidence
      };
    }

    return null;
  }
};
