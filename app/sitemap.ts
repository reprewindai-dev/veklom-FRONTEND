import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://veklom.com'
  
  const url = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : baseUrl

  return [
    { url: `${url}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${url}/overview`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${url}/vnp`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${url}/os/onboarding`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${url}/gpc`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${url}/spine`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${url}/trust`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${url}/compliance`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${url}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${url}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${url}/legal`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 }
  ]
}
