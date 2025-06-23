/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        appDir: true,
        swcPlugins: [
            ["next-superjson-plugin", {}]
        ]
    },
    images: {
        domains: [
            "res.cloudinary.com",
            "api.cloudinary.com",
            "avatars.githubusercontent.com",
            "lh3.googleusercontent.com",
            "images.unsplash.com"
        ]
    }
};

export default nextConfig;