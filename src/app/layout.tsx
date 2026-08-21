import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Virtual Try-on Studio',
  description: 'AI 虚拟试衣批量处理工具 - 高效管理服装与模特图片，一键批量生成试穿效果',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
