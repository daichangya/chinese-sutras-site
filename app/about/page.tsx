/**
 * 关于页
 * @author 代长亚
 */
import Link from "next/link";
import { DiscoveryLayout } from "@/components/layout/discovery-layout";
import { SectionHeader } from "@/components/ui/section-header";
import { brandAboutIntro, BRAND_AUTHOR_EMAIL, BRAND_AUTHOR_NAME, BRAND_REPO_URL, getBrandName } from "@/lib/brand";

export default function AboutPage() {
  const brandName = getBrandName();
  return (
    <DiscoveryLayout label="关于" title={`关于${brandName}`}>
      <div className="prose-jx max-w-none text-base">
        <p>
          {brandAboutIntro()}
        </p>
        <SectionHeader label="经文版权" className="mt-10" />
        <p>
          本站经文底本来自 CBETA 电子佛典集成（中华电子佛典协会）。使用与转载请遵循{" "}
          <a
            href="https://www.cbeta.org/copyright.php"
            className="text-[var(--jx-accent-cinnabar)] underline underline-offset-2 dark:text-[var(--jx-gold)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            CBETA 版权说明
          </a>
          。
        </p>
        <SectionHeader label="AI 说明" className="mt-10" />
        <p>白话译文与划选解释由 AI 辅助生成，可能存在偏差，仅供学习参考。</p>
        <SectionHeader label="作者与项目" className="mt-10" />
        <p>
          本站由{" "}
          <span className="font-medium text-[var(--foreground)]">{BRAND_AUTHOR_NAME}</span>{" "}
          开发与维护。问题反馈或合作请联系{" "}
          <a
            href={`mailto:${BRAND_AUTHOR_EMAIL}`}
            className="text-[var(--jx-accent-cinnabar)] underline underline-offset-2 dark:text-[var(--jx-gold)]"
          >
            {BRAND_AUTHOR_EMAIL}
          </a>
          。
        </p>
        <p className="mt-3">
          应用源码：
          <a
            href={BRAND_REPO_URL}
            className="ml-1 text-[var(--jx-accent-cinnabar)] underline underline-offset-2 dark:text-[var(--jx-gold)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/daichangya/chinese-sutras-site
          </a>
        </p>
      </div>
      <p className="mt-12 text-center">
        <Link href="/" className="text-sm text-[var(--muted)] underline-offset-4 hover:underline">
          返回首页
        </Link>
      </p>
    </DiscoveryLayout>
  );
}
