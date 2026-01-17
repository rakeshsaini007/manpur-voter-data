
export interface VoterRecord {
  booth: string;          // बूथ संख्या
  voterNo: string;        // मतदाता क्रमांक
  houseNo: string;        // मकान नं०
  name: string;           // निर्वाचक का नाम
  relationName: string;   // पिता/पति/माता का नाम
  gender: string;         // लिंग
  originalAge: string;    // आयु (Current)
  aadhar: string;         // आधार संख्या
  dob: string;            // जन्म तिथि
  calculatedAge: string;  // उम्र (as of Jan 1, 2026)
  rowIdx?: number;        // Tracking row in Sheet
  isNew?: boolean;        // If manually added
}

export interface ApiSearchResponse {
  success: boolean;
  data: VoterRecord[];
  error?: string;
}

export interface ApiSaveResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  member?: VoterRecord;
}
