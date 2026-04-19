import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

function sanitizeEmbed(html: string): string {
    const iframe = html.match(/<iframe[\s\S]*?<\/iframe>/i);
    return iframe ? iframe[0] : '';
}

interface PageModel {
    id: number;
    slug: string;
    title: string;
    icon: string | null;
    content: string | null;
    map_embed: string | null;
    meta_description: string | null;
    published: boolean;
}

interface Props {
    page: PageModel;
}

export default function PageEdit({ page }: Props) {
    const editorRef = useRef<any>(null);
    const { data, setData, put, processing, errors } = useForm({
        title: page.title,
        icon: page.icon ?? '',
        content: page.content ?? '',
        map_embed: page.map_embed ?? '',
        meta_description: page.meta_description ?? '',
        published: page.published,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const html = editorRef.current?.getContent();
        if (html !== undefined && html !== data.content) setData('content', html);
        put(`/admin/pages/${page.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout title={`Edit: ${page.title}`} nav={adminNav('pages')}>
            <Head title={`Edit ${page.title}`} />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <Link href="/admin/pages" className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-arrow-left me-1"></i>Back to Pages
                </Link>
                <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-box-arrow-up-right me-1"></i>View Live
                </a>
            </div>

            <form onSubmit={submit}>
                <div className="row g-3">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                    />
                                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Content</label>
                                    <Editor
                                        tinymceScriptSrc="/vendor/tinymce/tinymce.min.js"
                                        licenseKey="gpl"
                                        onInit={(_, editor) => (editorRef.current = editor)}
                                        initialValue={data.content}
                                        onEditorChange={(html) => setData('content', html)}
                                        init={{
                                            height: 520,
                                            menubar: false,
                                            promotion: false,
                                            branding: false,
                                            plugins: [
                                                'advlist',
                                                'autolink',
                                                'lists',
                                                'link',
                                                'image',
                                                'charmap',
                                                'preview',
                                                'anchor',
                                                'searchreplace',
                                                'visualblocks',
                                                'code',
                                                'fullscreen',
                                                'insertdatetime',
                                                'media',
                                                'table',
                                                'wordcount',
                                            ],
                                            toolbar:
                                                'undo redo | blocks | bold italic underline | forecolor backcolor | ' +
                                                'alignleft aligncenter alignright alignjustify | ' +
                                                'bullist numlist outdent indent | link image table | ' +
                                                'removeformat code fullscreen',
                                            content_style:
                                                "body { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; line-height: 1.6; }",
                                            block_formats:
                                                'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4; Preformatted=pre',
                                        }}
                                    />
                                    {errors.content && <div className="text-danger small mt-1">{errors.content}</div>}
                                </div>

                                <div className="mb-0">
                                    <label className="form-label d-flex justify-content-between align-items-center">
                                        <span>
                                            <i className="bi bi-geo-alt-fill text-primary me-1"></i>
                                            Google Maps Embed Code
                                            <span className="small text-secondary ms-2">optional</span>
                                        </span>
                                        <a
                                            href="https://www.google.com/maps"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="small text-decoration-none"
                                        >
                                            Get embed code <i className="bi bi-box-arrow-up-right"></i>
                                        </a>
                                    </label>
                                    <textarea
                                        value={data.map_embed}
                                        onChange={(e) => setData('map_embed', e.target.value)}
                                        rows={4}
                                        placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>'
                                        className={`form-control font-monospace ${errors.map_embed ? 'is-invalid' : ''}`}
                                        style={{ fontSize: 12 }}
                                    />
                                    {errors.map_embed && <div className="invalid-feedback">{errors.map_embed}</div>}
                                    <div className="form-text">
                                        In Google Maps: <em>Share → Embed a map → Copy HTML</em>. Paste the full &lt;iframe&gt; here.
                                    </div>
                                    {data.map_embed && (
                                        <div className="mt-3">
                                            <div className="small text-secondary mb-1">Preview:</div>
                                            <div
                                                className="ratio ratio-21x9 rounded-3 overflow-hidden border"
                                                dangerouslySetInnerHTML={{ __html: sanitizeEmbed(data.map_embed) }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm mb-3">
                            <div className="card-body">
                                <div className="fw-bold mb-3">Settings</div>

                                <div className="mb-3">
                                    <label className="form-label small">Slug</label>
                                    <input
                                        type="text"
                                        value={page.slug}
                                        readOnly
                                        disabled
                                        className="form-control form-control-sm bg-body-tertiary"
                                    />
                                    <div className="form-text">URL: /{page.slug}</div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small">Icon (Bootstrap Icon class)</label>
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text">
                                            <i className={`bi ${data.icon || 'bi-file-text'}`}></i>
                                        </span>
                                        <input
                                            type="text"
                                            value={data.icon}
                                            onChange={(e) => setData('icon', e.target.value)}
                                            placeholder="bi-info-circle"
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-text">
                                        <a href="https://icons.getbootstrap.com/" target="_blank" rel="noreferrer">
                                            Browse icons ↗
                                        </a>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small">Meta Description (SEO)</label>
                                    <textarea
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        rows={2}
                                        maxLength={255}
                                        className="form-control form-control-sm"
                                    />
                                    <div className="form-text">{data.meta_description.length}/255</div>
                                </div>

                                <div className="form-check form-switch">
                                    <input
                                        id="published"
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={data.published}
                                        onChange={(e) => setData('published', e.target.checked)}
                                    />
                                    <label htmlFor="published" className="form-check-label">
                                        Published (visible to public)
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100" disabled={processing}>
                            {processing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>Saving…
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check2-circle me-1"></i>Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
