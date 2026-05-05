import CryptoJS from "crypto-js";
import { useNavigate } from "react-router-dom";

// Define the type for user details
interface UserDetails {
    id?: string;
    name: string;
    email?: string;
    role?: string;
    phoneNumber?: string;
    // Add other fields as necessary
}

export const getUserDetails = (): UserDetails | null => {
    const navigate = useNavigate(); // Access the navigate function from react-router-dom

    try {
        const hashedUser = localStorage.getItem("userDetails");
        if (hashedUser) {
            const bytes = CryptoJS.AES.decrypt(hashedUser, "your-secret-key");
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            // Ensure the decrypted data is not empty
            if (!decryptedData) {
                console.error("Decryption returned an empty string.");
                navigate("/login"); // Redirect to login page
                localStorage.clear();
                return null;
            }

            const user: UserDetails = JSON.parse(decryptedData);
            return user;
        }
        return null;
    } catch (error) {
        console.error("Error decrypting or parsing user details:", error);
        return null;
    }
};
