import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'prevent-font-html-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.match(/\.(woff2?|ttf|eot)(\?.*)?$/)) {
            res.statusCode = 404;
            return res.end();
          }
          next();
        });
      }
    }
  ]
})
