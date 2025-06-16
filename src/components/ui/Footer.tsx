export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} LastMinute. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 