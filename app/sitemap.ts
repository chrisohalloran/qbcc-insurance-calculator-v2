import { MetadataRoute } from 'next'
import { guides } from './guides/[slug]/guides-data'
import { getTendrankPosts } from '@/lib/tendrank-content'

const BASE_URL = 'https://www.qbccinsurancecalculator.com.au'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const tendrankPosts = await getTendrankPosts()

  const commonEstimates = [
    { type: 'new-construction', value: 300000 },
    { type: 'new-construction', value: 450000 },
    { type: 'new-construction', value: 600000 },
    { type: 'renovation', value: 50000 },
    { type: 'renovation', value: 150000 },
    { type: 'renovation', value: 250000 },
  ]

  const estimates = commonEstimates.map((est) => ({
    url: `${BASE_URL}/estimate/${est.type}/${est.value}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const contentPages = [
    { path: '/costs', priority: 0.8 },
    { path: '/guide', priority: 0.8 },
    { path: '/guides', priority: 0.8 },
    { path: '/who-needs-it', priority: 0.8 },
    { path: '/owner-builder', priority: 0.8 },
    { path: '/toolkit', priority: 0.7 },
    { path: '/faq', priority: 0.7 },
  ].map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: page.priority,
  }))

  const guidePages = Object.entries(guides).map(([slug, guide]) => ({
    url: `${BASE_URL}/guides/${slug}`,
    lastModified: new Date(guide.updatedDate || guide.publishedDate),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const managedPages = tendrankPosts.map((post) => ({
    url: `${BASE_URL}/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...contentPages,
    ...guidePages,
    ...managedPages,
    ...estimates,
  ]
}
