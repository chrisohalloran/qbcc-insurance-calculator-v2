import type { Metadata } from "next"
import Link from "next/link"
import { ContentNav } from "@/components/content-nav"
import { guides } from "./[slug]/guides-data"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock } from "lucide-react"

export const metadata: Metadata = {
  alternates: {canonical: "https://www.qbccinsurancecalculator.com.au/guides"},
  title: "QBCC Insurance Guides | QBCC Calculator",
  description: "Learn about QBCC home warranty insurance with our comprehensive guides.",
  keywords: ["QBCC insurance", "home warranty", "Queensland building insurance", "QBCC guides"],
}

export default function GuidesPage() {
  const guideEntries = Object.entries(guides).map(([slug, guide]) => ({
    slug,
    ...guide,
  }))

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">QBCC Insurance Guides</h1>
        <p className="text-muted-foreground mb-8">
          Learn about QBCC home warranty insurance with our comprehensive guides.
        </p>

        <ContentNav currentPath="/guides" />
        <div className="mt-6 grid gap-6">
          {guideEntries.map((guide) => (
            <Card key={guide.slug} className="overflow-hidden">
              <CardHeader>
                <div className="text-xs text-muted-foreground mb-1">{guide.category}</div>
                <CardTitle className="text-xl">{guide.title}</CardTitle>
                <CardDescription>{guide.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  <span>{guide.readTime}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/guides/${guide.slug}`} className="w-full">
                  <Button className="w-full">
                    Read Guide
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
