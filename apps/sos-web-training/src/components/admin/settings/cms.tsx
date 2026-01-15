'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Pagination,
  Spinner,
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerBody,
} from '@heroui/react';
import {
  usePages,
  useCreatePage,
  useUpdatePage,
  useDeletePage,
  usePosts,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  PageStatus,
  PostStatus,
  type Page,
  type Post,
} from '@/hooks/api/use-cms';
import { addToast } from '@heroui/react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiArrowLeft } from 'react-icons/fi';
import { SelectWithClassName } from '../../forms/selectWithClassName';
import dayjs from 'dayjs';
import ConfirmationModal from '../../forms/ConfirmationModal';
import { PageBuilder } from '../PageBuilder';

// Page Editor Component (full-page like Elementor)
interface PageEditorProps {
  page?: Page;
  onBack: () => void;
}

function PageEditor({ page, onBack }: PageEditorProps) {
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const [formData, setFormData] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    content: page?.content || '',
    excerpt: page?.excerpt || '',
    status: page?.status || PageStatus.DRAFT,
    meta_title: page?.meta_title || '',
    meta_description: page?.meta_description || '',
    options: page?.options || {
      on_menu: false,
      on_footer: false,
    },
  });

  const handleContentChange = useCallback((content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug) {
      addToast({ title: 'Title and slug are required', color: 'warning' });
      return;
    }

    try {
      if (page) {
        await updatePage.mutateAsync({
          data: formData,
        });
        addToast({ title: 'Page updated successfully', color: 'success' });
      } else {
        await createPage.mutateAsync(formData);
        addToast({ title: 'Page created successfully', color: 'success' });
      }
      onBack();
    } catch (error) {
      addToast({ title: 'Failed to save page', color: 'danger' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={onBack}
            className="text-text"
          >
            <FiArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-text">
              {page ? 'Edit Page' : 'Create New Page'}
            </h2>
            <p className="text-sm text-default-500">
              Drag and drop widgets to build your page
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={createPage.isPending || updatePage.isPending}
          >
            {page ? 'Update Page' : 'Create Page'}
          </Button>
        </div>
      </div>

      <Card className="bg-backgroundSecondary border border-border">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              labelPlacement='outside-top'
              label={page ? `Slug (Read Only)` : "Slug"}
              value={formData.slug}
              isDisabled={!!page}
              isRequired
              onValueChange={(value) => setFormData({ ...formData, slug: value })}
              classNames={{
                base: 'data-[disabled=true]:opacity-100',
                inputWrapper: 'bg-background border-border border group-data-[disabled=true]:cursor-not-allowed',
                input: 'text-text',
              }}
            />
            <Input
              labelPlacement='outside-top'
              label="Title"
              value={formData.title}
              isRequired
              onValueChange={(value) => setFormData({ ...formData, title: value })}
              classNames={{
                inputWrapper: 'bg-background border-border border',
                input: 'text-text',
              }}
            />
            <CheckboxGroup
              label="Options"
              orientation="horizontal"
              classNames={{
                base: 'col-span-2',
              }}
              value={[
                ...(formData.options?.on_menu ? ['on_menu'] : []),
                ...(formData.options?.on_footer ? ['on_footer'] : []),
              ]}
              onValueChange={(values) => {
                setFormData({
                  ...formData,
                  options: {
                    on_menu: values.includes('on_menu'),
                    on_footer: values.includes('on_footer'),
                  },
                });
              }}
            >
              <Checkbox value="on_menu">Show on Menu</Checkbox>
              <Checkbox value="on_footer">Show on Footer</Checkbox>
            </CheckboxGroup>
            <div className="col-span-2">
              <div className="text-small text-foreground mb-3">Content <span className="text-danger">*</span></div>
              <PageBuilder
                initialContent={formData.content}
                onChange={handleContentChange}
                pageTitle={formData.title}
                options={formData.options}
              />
            </div>
            <Textarea
              labelPlacement='outside-top'
              label="Excerpt"
              value={formData.excerpt}
              onValueChange={(value) => setFormData({ ...formData, excerpt: value })}
              classNames={{
                inputWrapper: 'bg-background border-border border',
                input: 'text-text',
              }}
            />
            <Input
              labelPlacement='outside-top'
              label="Meta Title"
              value={formData.meta_title}
              onValueChange={(value) => setFormData({ ...formData, meta_title: value })}
              classNames={{
                inputWrapper: 'bg-background border-border border',
                input: 'text-text',
              }}
            />
            <Textarea
              labelPlacement='outside-top'
              label="Meta Description"
              value={formData.meta_description}
              onValueChange={(value) => setFormData({ ...formData, meta_description: value })}
              classNames={{
                inputWrapper: 'bg-background border-border border',
                input: 'text-text',
              }}
            />
            <SelectWithClassName
              label="Status"
              labelPlacement='outside'
              selectedKeys={[formData.status]}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, status: Array.from(keys)[0] as PageStatus })
              }
              classNames={{
                trigger: 'bg-background border-border border',
                value: 'text-text',
              }}
              children={
                <>
                  <SelectItem key={PageStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem key={PageStatus.PUBLISHED}>Published</SelectItem>
                  <SelectItem key={PageStatus.ARCHIVED}>Archived</SelectItem>
                </>
              }
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// Page Management Component
export function PagesTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<{
    status?: PageStatus;
    page?: number;
    limit?: number;
  }>({
    status: undefined,
    page: undefined,
    limit: undefined,
  });
  const { data, isLoading } = usePages({
    search: search || undefined,
    status: filter.status || undefined,
    page: filter.page || undefined,
    limit: filter.limit || undefined,
  });
  const deletePage = useDeletePage();
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<string>('');

  const handleEdit = (page: Page) => {
    setEditingPage(page);
  };

  const handleCreate = () => {
    setIsCreating(true);
  };

  const handleBack = () => {
    setEditingPage(null);
    setIsCreating(false);
  };

  const handleDelete = async (slug: string) => {
    try {
      await deletePage.mutateAsync(slug);
      addToast({ title: 'Page deleted successfully', color: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to delete page', color: 'danger' });
    }
  };

  const getStatusColor = (status: PageStatus) => {
    switch (status) {
      case PageStatus.PUBLISHED:
        return 'success';
      case PageStatus.DRAFT:
        return 'warning';
      case PageStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  // // Show editor if editing or creating
  // if (editingPage || isCreating) {
  //   return (
  //     <PageEditor
  //       page={editingPage || undefined}
  //       onBack={handleBack}
  //     />
  //   );
  // }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Search pages..."
            value={search}
            onValueChange={setSearch}
            startContent={<FiSearch />}
            classNames={{
              base: 'min-w-40',
              inputWrapper:
                'border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary bg-background',
              input: 'text-text group-data-[has-value=true]:text-text',
            }}
            className="flex-1"
          />
          <SelectWithClassName
            id="status"
            aria-label="Status"
            selectedKeys={filter.status ? [filter.status.toString()] : ['all']}
            onSelectionChange={(keys) => {
              if (Array.from(keys)[0] === 'all') {
                setFilter({ ...filter, status: undefined });
              } else {
                setFilter({ ...filter, status: Array.from(keys)[0] as PageStatus });
              }
            }}
            classNames={{
              base: 'w-40',
              trigger: 'bg-background border-border data-[open=true]:border-border',
              label: 'text-text',
              value: 'text-text group-data-[has-value=true]:text-text',
              listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
              selectorIcon: 'text-text',
            }}
            selectorIconColor="text-text"
            children={
              <>
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key={PageStatus.DRAFT}>Draft</SelectItem>
                <SelectItem key={PageStatus.PUBLISHED}>Published</SelectItem>
                <SelectItem key={PageStatus.ARCHIVED}>Archived</SelectItem>
              </>
            }
          />
          <Button
            color="primary"
            onPress={handleCreate}
            startContent={<FiPlus className="text-white" />}
            className="ml-auto"
          >
            New Page
          </Button>
        </div>

        <Card className="bg-backgroundSecondary border border-border">
          <CardBody>
            <Table
              aria-label="Pages table"
              bottomContent={
                <div className="flex justify-center items-center">
                  <Pagination
                    total={data?.totalPages || 0}
                    page={data?.page || 1}
                    onChange={(page) => {
                      setFilter({ ...filter, page: page });
                    }}
                  />
                </div>
              }
              removeWrapper
            >
              <TableHeader>
                <TableColumn>Slug</TableColumn>
                <TableColumn>Title</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Created</TableColumn>
                <TableColumn width={100} align="center">
                  Actions
                </TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={
                  <span>
                    {isLoading ? (
                      <>
                        <Spinner label="Loading..." />
                        <br />
                        Loading...
                      </>
                    ) : (
                      'No pages found'
                    )}
                  </span>
                }
              >
                {data?.data && data.data.length > 0 ? (
                  data.data.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="text-text text-sm">{page.slug}</TableCell>
                      <TableCell className="text-text">{page.title}</TableCell>
                      <TableCell className={`text-${getStatusColor(page.status)} text-sm`}>
                        {page.status}
                      </TableCell>
                      <TableCell className="text-text text-sm">
                        {new Date(page.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="solid"
                            color="primary"
                            onPress={() => handleEdit(page)}
                          >
                            <FiEdit2 className="text-white" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="solid"
                            color="danger"
                            onPress={() => setIsDeleteOpen(page.id!)}
                          >
                            <FiTrash2 className="text-white" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-text text-center">
                      No pages found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <ConfirmationModal
          isOpen={isDeleteOpen !== ''}
          onClose={() => setIsDeleteOpen('')}
          onConfirm={() => handleDelete(isDeleteOpen)}
          title="Confirmation"
          message={`Are you sure you want to delete this Page?`}
        />
      </div>

      <Drawer
        backdrop="blur"
        isOpen={editingPage !== null || isCreating !== false}
        onClose={() => {
          handleBack();
        }}
        size="4xl"
      >
        <DrawerContent className="bg-backgroundSecondary">
          {(onClose) => (
            <>
              <DrawerHeader>
                <div className="text-lg font-medium">Confirmation</div>
              </DrawerHeader>
              <DrawerBody>
                <PageEditor
                  page={editingPage || undefined}
                  onBack={() => {
                    onClose();
                  }}
                />
              </DrawerBody>
              <DrawerFooter>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();
                  }}
                >
                  Save
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Posts Tab Component (similar structure)
export function PostsTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<{
    status?: string;
    page?: number;
    limit?: number;
  }>({
    status: undefined,
    page: undefined,
    limit: undefined,
  });
  const { data, isLoading } = usePosts({
    search: search || undefined,
    status: filter.status ? filter.status === 'all' ? undefined : filter.status as PostStatus : undefined,
    page: filter.page || undefined,
    limit: filter.limit || undefined,
  });
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    details: '',
    status: PostStatus.DRAFT,
  });
  const [isDeleteOpen, setIsDeleteOpen] = useState<string>('');

  const handleOpen = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        details: post.details,
        status: post.status,
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        details: '',
        status: PostStatus.PUBLISHED,
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (editingPost) {
        await updatePost.mutateAsync({ id: editingPost.id, data: formData });
        addToast({ title: 'Post updated successfully', color: 'success' });
      } else {
        await createPost.mutateAsync(formData);
        addToast({ title: 'Post created successfully', color: 'success' });
      }
      onClose();
    } catch (error) {
      addToast({ title: 'Failed to save post', color: 'danger' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost.mutateAsync(id);
      addToast({ title: 'Post deleted successfully', color: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to delete post', color: 'danger' });
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PUBLISHED:
        return 'success';
      case PostStatus.DRAFT:
        return 'warning';
      case PostStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search posts..."
          value={search}
          onValueChange={setSearch}
          startContent={<FiSearch className="text-text" />}
          classNames={{
            inputWrapper:
              'px-2 border-border border-2 group-data-[focus=true]:border-border bg-backgroundSecondary',
            label: 'text-text text-sm',
            input: 'text-text',
          }}
          className="flex-1"
        />
        <SelectWithClassName
          id="status"
          selectedKeys={filter.status ? [filter.status.toString()] : ['all']}
          onSelectionChange={(keys) =>
            setFilter({ ...filter, status: Array.from(keys)[0] as PostStatus })
          }
          selectorIconColor="text-text"
          classNames={{
            base: 'w-40',
            trigger: 'bg-backgroundSecondary border-border data-[open=true]:border-border',
            label: 'text-text',
            value: 'text-text group-data-[has-value=true]:text-text',
            listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
            selectorIcon: 'text-text',
          }}
          children={
            <>
              <SelectItem key="all" textValue="All Status">
                All Status
              </SelectItem>
              <SelectItem key={PostStatus.DRAFT} textValue="Draft">
                Draft
              </SelectItem>
              <SelectItem key={PostStatus.PUBLISHED} textValue="Published">
                Published
              </SelectItem>
              <SelectItem key={PostStatus.ARCHIVED} textValue="Archived">
                Archived
              </SelectItem>
            </>
          }
        />
        <Button
          color="primary"
          onPress={() => handleOpen()}
          startContent={<FiPlus className="text-white" />}
        >
          New Post
        </Button>
      </div>

      <Card className="bg-backgroundSecondary border border-border">
        <CardBody>
          <Table
            aria-label="Posts table"
            removeWrapper
            bottomContent={
              data?.data && data.data.length > 0 && (
                <div className="flex justify-center items-center">
                  <Pagination
                    total={data?.totalPages || 0}
                    page={data?.page || 1}
                    onChange={(page) => {
                      setFilter({ ...filter, page: page });
                    }}
                  />
                </div>
              )
            }
          >
            <TableHeader>
              <TableColumn>Title</TableColumn>
              <TableColumn>Details</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Created</TableColumn>
              <TableColumn width={100} align="center">Actions</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              loadingContent={
                <TableRow>
                  <TableCell colSpan={5} className="text-text text-center">
                    <Spinner label="Loading..." />
                  </TableCell>
                </TableRow>
              }
              emptyContent={
                <span>
                  {isLoading ? (
                    <>
                      <Spinner label="Loading..." />
                      <br />
                      Loading...
                    </>
                  ) : (
                    "No posts found"
                  )}
                </span>
              }
            >
              {data?.data && data.data.length > 0 ? (
                data.data.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="text-text">{post.title}</TableCell>
                    <TableCell className="text-text text-sm">
                      {post.details ? post.details.substring(0, 100) + '...' : '-'}
                    </TableCell>
                    <TableCell className={`text-${getStatusColor(post.status)} text-sm`}>
                      {post.status}
                    </TableCell>
                    <TableCell className="text-text text-sm">
                      {dayjs(post.created_at).format('MM/DD/YYYY')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="solid"
                          color="primary"
                          onPress={() => handleOpen(post)}
                        >
                          <FiEdit2 className="text-white" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="solid"
                          color="danger"
                          onPress={() => {
                            setIsDeleteOpen(post.id!);
                          }}
                        >
                          <FiTrash2 className="text-white" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-text text-center">
                    No posts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        className="bg-backgroundSecondary"
      >
        <ModalContent>
          <ModalHeader>{editingPost ? 'Edit Post' : 'Create Post'}</ModalHeader>
          <ModalBody>
            <Input
              label="Title"
              value={formData.title}
              onValueChange={(value) => setFormData({ ...formData, title: value })}
              classNames={{
                inputWrapper:
                  'bg-backgroundSecondary border-border border-2 group-data-[focus=true]:border-border',
                input: 'text-text',
              }}
            />
            <Textarea
              label="Details"
              value={formData.details}
              onValueChange={(value) => setFormData({ ...formData, details: value })}
              classNames={{
                inputWrapper:
                  'bg-backgroundSecondary border-border border-2 group-data-[focus=true]:border-border',
                input: 'text-text',
              }}
              minRows={10}
            />
            {editingPost ? (
              <SelectWithClassName
                id="status"
                label="Status"
                selectedKeys={formData.status ? [formData.status.toString()] : ['all']}
                onSelectionChange={(keys) =>
                  setFormData({
                    ...formData,
                    status: (Array.from(keys)[0] as PostStatus) || PostStatus.DRAFT,
                  })
                }
                classNames={{
                  base: 'w-40',
                  trigger: 'bg-background border-border data-[open=true]:border-border',
                  label: 'text-text',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                  selectorIcon: 'text-text',
                }}
                selectorIconColor="text-text"
                children={
                  <>
                    <SelectItem key={PostStatus.DRAFT} textValue="Draft">
                      Draft
                    </SelectItem>
                    <SelectItem key={PostStatus.PUBLISHED} textValue="Published">
                      Published
                    </SelectItem>
                    <SelectItem key={PostStatus.ARCHIVED} textValue="Archived">
                      Archived
                    </SelectItem>
                  </>
                }
              />
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={onClose} className="text-text">
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={createPost.isPending || updatePost.isPending}
            >
              {editingPost ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteOpen !== ''}
        onClose={() => setIsDeleteOpen('')}
        onConfirm={() => handleDelete(isDeleteOpen)}
        title="Confirmation"
        message={`Are you sure you want to delete this Post?`}
      />
    </div>
  );
}

