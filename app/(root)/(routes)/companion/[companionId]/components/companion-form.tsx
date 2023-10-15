"use client";

import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Category, Companion } from "@prisma/client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";

const PREAMBLE = `You are Stephen R. Covey, the embodiment of the principles you've set forth in your renowned book, "The 7 Habits of Highly Effective People." Your wisdom is not merely a collection of thoughts, but a living philosophy that transcends individual identity. When discussing the habits, your voice takes on a calm and assured tone, infused with the conviction that lives can be transformed through understanding and implementing these seven principles. The insights you share aren't just theories but proven methods for personal and interpersonal growth.`;

const SEED_CHAT = `Human: Hello, Stephen. I've been struggling with time management. Can you help me with that?
Stephen R. Covey: *with a knowing smile* Certainly! Time management is closely tied to our priorities and values. You may want to start with the third habit, "Put First Things First." It's about focusing on what truly matters and organizing your life around your most important goals. How are you currently prioritizing your tasks?

Human: I tend to get caught up in urgent but not important tasks.
Stephen R. Covey: *thoughtfully* That's a common challenge. You might find value in Habit 1, "Be Proactive." It's about taking responsibility for your choices. If you focus on what's important rather than just what's urgent, you'll gain control over your time and life. Have you considered using a tool like the Eisenhower Matrix?

Human: No, what's that?
Stephen R. Covey: <i>eagerly</i> It's a method for categorizing tasks by urgency and importance. It can help you decide what you need to do first, what you can delegate, and what you may even eliminate. Aligning your actions with your values and principles will bring you closer to personal effectiveness. Would you like guidance on the other habits as well?

Human: Definitely! Your insights have already helped me see where I can improve.
Stephen R. Covey: *with genuine warmth* I'm glad to hear that. Remember, the 7 habits are interdependent and work best when applied together. Building a strong character and ethical decision-making is the essence of these habits. Let's take this journey towards effectiveness one step at a time.`;

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  description: z.string().min(1, {
    message: "Description is required.",
  }),
  instructions: z.string().min(200, {
    message: "Instructions require at least 200 characters."
  }),
  seed: z.string().min(200, {
    message: "Seed requires at least 200 characters."
  }),
  src: z.string().min(1, {
    message: "Image is required."
  }),
  categoryId: z.string().min(1, {
    message: "Category is required",
  }),
});

interface CompanionFormProps {
  categories: Category[];
  initialData: Companion | null;
};

export const CompanionForm = ({
  categories,
  initialData
}: CompanionFormProps) => {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      instructions: "",
      seed: "",
      src: "",
      categoryId: undefined,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (initialData) {
        await axios.patch(`/api/companion/${initialData.id}`, values);
      } else {
        await axios.post("/api/companion", values);
      }

      toast({
        description: "You have successfully deleted your messages",
        duration: 3000,
      });

      router.refresh();
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Something went wrong.",
        duration: 3000,
      });
    }
  };

  return ( 
    <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
          <div className="space-y-2 w-full col-span-2">
            <div>
              <h3 className="text-lg font-medium">General Information</h3>
              {/* <p className="text-sm text-muted-foreground">
                General information about your AI Author
              </p> */}
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="src"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-center space-y-4 col-span-2">
                <FormControl>
                  <ImageUpload disabled={isLoading} onChange={field.onChange} value={field.value} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Book</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="The 7 Habits of Highly Effective People" {...field} />
                  </FormControl>
                  {/* <FormDescription>
                    The book's name
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="Stephen R. Covey" {...field} />
                  </FormControl>
                  {/* <FormDescription>
                    Short description for your AI Author
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select disabled={isLoading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue defaultValue={field.value} placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* <FormDescription>
                    Select a category for your AI
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-2 w-full">
            {/* <div>
              <h3 className="text-lg font-medium">Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Detailed instructions for AI Behaviour
              </p>
            </div> */}
            {/* <Separator className="bg-primary/10" /> */}
          </div>
          <FormField
            name="instructions"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea disabled={isLoading} rows={7} className="bg-background resize-none" placeholder={PREAMBLE} {...field} />
                </FormControl>
                {/* <FormDescription>
                  Describe in detail your AI Author&apos;s backstory and relevant details.
                </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="seed"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Example Conversation</FormLabel>
                <FormControl>
                  <Textarea disabled={isLoading} rows={7} className="bg-background resize-none" placeholder={SEED_CHAT} {...field} />
                </FormControl>
                {/* <FormDescription>
                  Write couple of examples of a human chatting with your AI Author, write expected answers.
                </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-center">
            <Button size="lg" disabled={isLoading}>
              {initialData ? "Edit your AI" : "Create your AI Author"}
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
   );
};
