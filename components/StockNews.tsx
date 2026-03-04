import Link from "next/link";
import { Newspaper, ExternalLink } from "lucide-react";

interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number; // Timestamp
  thumbnail?: {
    resolutions: { url: string }[];
  };
}

export function StockNews({ news }: { news: any[] }) {
  if (!news || news.length === 0) {
    return (
      <div className="text-center text-slate-500 py-10 bg-slate-900/30 rounded-xl border border-slate-800">
        <Newspaper className="mx-auto mb-2 opacity-50" size={32} />
        <p>לא נמצאו חדשות אחרונות למניה זו</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2 text-white">
        <Newspaper className="text-blue-400" size={20} />
        חדשות ועדכונים
      </h3>
      
      <div className="grid gap-4">
        {news.map((item: NewsItem) => (
          <Link 
            href={item.link} 
            key={item.uuid} 
            target="_blank"
            className="group block bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition duration-200"
          >
            <div className="flex gap-4 items-start">
              
              {/* תמונה (אם קיימת) */}
              {item.thumbnail?.resolutions?.[0]?.url && (
                <div className="hidden sm:block w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-950">
                  <img 
                    src={item.thumbnail.resolutions[0].url} 
                    alt="News thumbnail" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-slate-200 group-hover:text-blue-400 transition line-clamp-2 leading-snug">
                    {item.title}
                    </h4>
                    <ExternalLink size={16} className="text-slate-600 group-hover:text-blue-400 flex-shrink-0 mt-1" />
                </div>
                
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {item.publisher}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(item.providerPublishTime * 1000).toLocaleDateString("he-IL", {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}