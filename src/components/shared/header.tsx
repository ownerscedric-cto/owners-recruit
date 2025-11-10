import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'

interface HeaderProps {
  title: string
  showBackButton?: boolean
  backUrl?: string
}

export function Header({ title, showBackButton = false, backUrl = '/' }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={backUrl}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {title}
              </h1>
              <span className="text-sm text-gray-500">
                오너스경영연구소 스마트 리크루팅
              </span>
            </div>
          </div>

          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              홈
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}