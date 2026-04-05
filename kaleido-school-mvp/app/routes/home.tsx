import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kaleido — IELTS Writing Prep" },
    { name: "description", content: "Study smarter, not longer." },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* ── Brand ───────────────────────────────────────────────────── */}
        <h1 className="text-3xl font-bold text-gray-900">kaleido</h1>

        {/* ── Message ─────────────────────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 flex flex-col gap-3">
          <p className="text-sm text-gray-700 leading-relaxed italic">
            Chào bạn,
          </p>
          <p className="text-sm text-gray-700 leading-relaxed italic">
            Mình cũng từng đến trường rồi lại đi học thêm - cầy cuốc thi cử từ sáng tới tối,
            buổi học này tiếp nối lớp học kia. Sau này, càng lớn mình càng được đi và &quot;sống&quot;
            nhiều hơn để thấy rằng cuộc sống có nhiều điều hay quá mà mình chưa biết. Mình ước
            mình có thêm thời gian để có nhiều trải nghiệm đa dạng hơn, và mình cũng mong điều
            tương tự cho các bạn.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed italic">
            Vậy nên chúng mình hy vọng Kaleido sẽ giúp bạn có thêm thời gian cho những trải
            nghiệm sống ý nghĩa và thú vị nhé!
          </p>
          <p className="text-sm text-gray-700 leading-relaxed italic">
            Chúc bạn nhiều may mắn!
          </p>
        </div>

        {/* ── CTAs ────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Link
            to="/sign-up"
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Get started →
          </Link>
          <Link
            to="/sign-in"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
