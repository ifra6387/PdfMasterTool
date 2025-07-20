function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">PDF Tools Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Select a tool to get started
                </p>
          </div>
          
          {/* Simple Tool Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Merge PDF</h3>
              <p className="text-gray-600">Combine multiple PDF files into one</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Split PDF</h3>
              <p className="text-gray-600">Split PDF into separate files</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Compress PDF</h3>
              <p className="text-gray-600">Reduce PDF file size</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-blue-600">PDF to Word</h3>
              <p className="text-gray-600">Convert PDF to Word document</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Word to PDF</h3>
              <p className="text-gray-600">Convert Word to PDF</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Protect PDF</h3>
              <p className="text-gray-600">Add password protection</p>
            </div>
          </div>
                </CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email:</p>
                      <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">User ID:</p>
                      <p className="text-gray-600 dark:text-gray-400 font-mono text-xs break-all">{user.id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Account Created:</p>
                      <p className="text-gray-600 dark:text-gray-400">{new Date(user.created_at).toLocaleString()}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Security Status</span>
                </CardTitle>
                <CardDescription>Authentication and security info</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900 dark:text-white">Authenticated</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900 dark:text-white">Session Active</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Connected to Supabase</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/')}>
              <CardHeader>
                <CardTitle className="text-lg">PDF Tools</CardTitle>
                <CardDescription>Access all PDF manipulation tools</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Merge, split, compress, and convert PDF files with our comprehensive toolkit.
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleLogout}>
              <CardHeader>
                <CardTitle className="text-lg">Logout</CardTitle>
                <CardDescription>End your current session</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Safely logout and return to the home page.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Session Info</span>
                </CardTitle>
                <CardDescription>Current session details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your session is active and secure. Logout when finished for security.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Simple Footer */}
          <div className="mt-12 text-center text-sm text-gray-500">
            <a href="/about.html" className="hover:text-blue-600">About</a> · 
            <a href="/terms.html" className="hover:text-blue-600">Terms</a> · 
            <a href="/privacy.html" className="hover:text-blue-600">Privacy</a> · 
            <a href="/contact.html" className="hover:text-blue-600">Contact</a>
          </div>
        </div>
      </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <Dashboard />
    </AuthGuard>
  );
}