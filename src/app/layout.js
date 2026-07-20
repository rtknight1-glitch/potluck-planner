import "./globals.css";

export const metadata = {
  title: "Potluck Planner",
    description: "Plan potlucks and other group events with easy online sign-ups",
    };

    export default function RootLayout({ children }) {
      return (
          <html lang="en">
                <body>{children}</body>
                    </html>
                      );
                      }
                      
