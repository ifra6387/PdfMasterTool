import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PDF_TOOLS, getToolsByCategory } from "@/lib/tools";
import { cn } from "@/lib/utils";

const categories = [
  { id: 'all', name: 'All Tools' },
  { id: 'organize', name: 'Organize' },
  { id: 'convert', name: 'Convert' },
  { id: 'edit', name: 'Edit' },
  { id: 'secure', name: 'Secure' },
];

export function ToolGrid() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const tools = getToolsByCategory(selectedCategory);

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 text-red-500',
      blue: 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 text-blue-500',
      green: 'bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 text-green-500',
      purple: 'bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 text-purple-500',
      orange: 'bg-orange-100 dark:bg-orange-900/30 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 text-orange-500',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 text-emerald-500',
      pink: 'bg-pink-100 dark:bg-pink-900/30 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 text-pink-500',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 text-indigo-500',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 text-yellow-500',
      teal: 'bg-teal-100 dark:bg-teal-900/30 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 text-teal-500',
      gray: 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 text-gray-500 dark:text-gray-400',
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <section id="tools" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
          Choose Your PDF Tool
        </h2>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "secondary"}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "font-medium",
                  selectedCategory === category.id
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                )}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {tools.map((tool) => (
            <Link key={tool.id} href={`/tool/${tool.id}`}>
              <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className={cn(
                      "w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center transition-colors",
                      getColorClasses(tool.color)
                    )}>
                      <i className={`${tool.icon} text-xl`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tool.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
