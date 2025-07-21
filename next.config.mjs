/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
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
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        config.externals = [...(config.externals || []), 'canvas'];
        return config;
    }
};

export default nextConfig;