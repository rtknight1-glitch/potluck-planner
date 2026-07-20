const ADJECTIVES = [
  "sunny", "cozy", "merry", "jolly", "golden", "happy", "spicy", "sweet",
    "cheerful", "toasty", "breezy", "lively",
    ];
    const NOUNS = [
      "table", "feast", "gathering", "supper", "picnic", "bash", "spread",
        "potluck", "banquet", "cookout",
        ];

        function randomToken(length = 24) {
          const chars =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                let out = "";
                  for (let i = 0; i < length; i++) {
                      out += chars[Math.floor(Math.random() * chars.length)];
                        }
                          return out;
                          }

                          export function generateSlug() {
                            const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
                              const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
                                const suffix = Math.floor(1000 + Math.random() * 9000);
                                  return `${adj}-${noun}-${suffix}`;
                                  }

                                  export function generateAdminToken() {
                                    return randomToken(28);
                                    }
                                    
